import os
import django
import io

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ccportal.settings')
django.setup()

from django.test import RequestFactory
from django.core.files.uploadedfile import SimpleUploadedFile
from teamcc.models import Project, ProjectResource
from teamcc.views import projects_list, project_resources, delete_project_resource

def run_tests():
    print("=== TESTING PROJECT RESOURCE SECTION & MULTI-FILE UPLOAD ===")
    
    # 1. Create a test project
    project, created = Project.objects.get_or_create(
        code="PR-TEST-VAULT",
        defaults={
            "title": "Autonomous Rover Multi-Resource Test",
            "description": "Test project for multi-file upload system.",
            "category": "iot",
            "lead_name": "Antigravity Test Lead",
            "progress": 50,
            "status": "In Progress"
        }
    )
    print(f"[OK] Project retrieved/created: {project.code} (ID: {project.id})")

    # 2. Upload multiple mock files (PDF, image, audio, doc, ppt)
    pdf_file = SimpleUploadedFile("rover_schematics.pdf", b"%PDF-1.4 Mock PDF Data for Testing", content_type="application/pdf")
    img_file = SimpleUploadedFile("chassis_blueprint.png", b"\x89PNG\r\n\x1a\nMock PNG Data", content_type="image/png")
    audio_file = SimpleUploadedFile("telemetry_chirp.mp3", b"ID3Mock Audio Data", content_type="audio/mpeg")
    ppt_file = SimpleUploadedFile("sprint_pitch.pptx", b"PK\x03\x04Mock PPTX Data", content_type="application/vnd.openxmlformats-officedocument.presentationml.presentation")
    doc_file = SimpleUploadedFile("specifications.docx", b"PK\x03\x04Mock DOCX Data", content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")

    factory = RequestFactory()
    
    upload_request = factory.post(
        f'/api/projects/{project.id}/resources/',
        {
            'files': [pdf_file, img_file, audio_file, ppt_file, doc_file],
            'uploaded_by': 'Test Engineer'
        }
    )
    
    response = project_resources(upload_request, project.id)
    print(f"[OK] Upload Response Status: {response.status_code}")
    assert response.status_code == 201, f"Expected 201, got {response.status_code}"
    
    uploaded_data = response.data.get('resources', [])
    print(f"[OK] Uploaded {len(uploaded_data)} files successfully.")
    for r in uploaded_data:
        print(f"   -> File: {r['title']} | Type: {r['file_type']} | Size: {r['file_size_formatted']} | URL: {r['file_url']}")
        assert r['file_type'] in ['pdf', 'image', 'audio', 'ppt', 'doc'], f"Unexpected file_type: {r['file_type']}"

    # 3. Test Storing External URLs in Resource Vault
    url_request = factory.post(
        f'/api/projects/{project.id}/resources/',
        {
            'url': 'https://github.com/team-cc/rover-firmware',
            'title': 'Rover Firmware GitHub Repo',
            'uploaded_by': 'Lead Architect'
        }
    )
    url_response = project_resources(url_request, project.id)
    print(f"[OK] URL Store Response Status: {url_response.status_code}")
    assert url_response.status_code == 201, f"Expected 201, got {url_response.status_code}"
    stored_url_res = url_response.data['resources'][0]
    print(f"   -> URL Resource: {stored_url_res['title']} | Type: {stored_url_res['file_type']} | URL: {stored_url_res['file_url']}")
    assert stored_url_res['file_type'] == 'github'
    assert stored_url_res['file_url'] == 'https://github.com/team-cc/rover-firmware'

    # Batch URLs test
    batch_url_req = factory.post(
        f'/api/projects/{project.id}/resources/',
        json.dumps({
            'urls': [
                {'url': 'https://www.figma.com/design/rover-ui', 'title': 'Rover Dashboard UI/UX Design'},
                {'url': 'https://docs.google.com/document/d/spec-123', 'title': 'System Architecture Spec'},
                {'url': 'https://rover-demo.vercel.app', 'title': 'Live Telemetry Dashboard'}
            ],
            'uploaded_by': 'Lead Architect'
        }),
        content_type='application/json'
    )
    batch_url_resp = project_resources(batch_url_req, project.id)
    assert batch_url_resp.status_code == 201
    print(f"[OK] Stored {len(batch_url_resp.data['resources'])} batch URL resources successfully.")

    # 4. Test Listing Project Resources
    get_request = factory.get(f'/api/projects/{project.id}/resources/')
    get_response = project_resources(get_request, project.id)
    assert get_response.status_code == 200, f"Expected 200, got {get_response.status_code}"
    print(f"[OK] Fetched {len(get_response.data)} resources for project {project.code}")

    # 5. Test Deleting one resource
    first_res_id = uploaded_data[0]['id']
    del_request = factory.delete(f'/api/projects/resources/{first_res_id}/')
    del_response = delete_project_resource(del_request, first_res_id)
    assert del_response.status_code == 200, f"Expected 200, got {del_response.status_code}"
    print(f"[OK] Successfully deleted resource ID {first_res_id}")

    # 6. Test Deleting a URL resource
    url_res_id = stored_url_res['id']
    del_url_req = factory.delete(f'/api/projects/resources/{url_res_id}/')
    del_url_resp = delete_project_resource(del_url_req, url_res_id)
    assert del_url_resp.status_code == 200
    print(f"[OK] Successfully deleted URL resource ID {url_res_id}")

    # 7. Clean up test project & test resources to leave zero dummy data in database
    for r in project.resources.all():
        if r.file and os.path.exists(r.file.path):
            try:
                os.remove(r.file.path)
            except Exception:
                pass
        r.delete()
    project.delete()
    print(f"[OK] Completely cleaned up test project PR-TEST-VAULT (zero dummy data left)")

    print("\nALL BACKEND TESTS PASSED SUCCESSFULLY!")

if __name__ == '__main__':
    import json
    run_tests()
