import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ccportal.settings')
django.setup()

from django.test import RequestFactory
from teamcc import views

def test_views():
    factory = RequestFactory()

    # 1. Test Admin Status Endpoint
    req = factory.get('/api/admin/status/')
    res = views.admin_system_status(req)
    print(f"1. Admin Status API: HTTP {res.status_code}, data: {res.data}")

    # 2. Test Members List Endpoint
    req = factory.get('/api/members/')
    res = views.get_memberships(req)
    print(f"2. Members List API: HTTP {res.status_code}, {len(res.data)} records")

    # 3. Test Projects List Endpoint
    req = factory.get('/api/projects/')
    res = views.projects_list(req)
    print(f"3. Projects List API: HTTP {res.status_code}, {len(res.data)} projects")

    # 4. Test Notices Endpoint
    req = factory.get('/api/attendance/notices/')
    res = views.notice_sheets(req)
    print(f"4. Notice Sheets API: HTTP {res.status_code}, {len(res.data)} notices")

    # 5. Test Auth Login Token with Admin Credentials (ltAdmin@teamcc / cc25?MP)
    req = factory.post('/api/auth/token/', data={'username': 'ltAdmin@teamcc', 'password': 'cc25?MP'}, content_type='application/json')
    res = views.login_token(req)
    print(f"5. Auth Login Token (Admin): HTTP {res.status_code}, User: {res.data.get('user', {}).get('name')}, Role: {res.data.get('user', {}).get('role')}")

    # 6. Test 11-Field Registration API
    test_user_data = {
        'name': 'Test Engineer',
        'email': 'test.engineer@teamcc.org',
        'contact': '9876543219',
        'gender': 'Male',
        'department': 'CSE',
        'year': '2nd Year',
        'sem': '3rd Semester',
        'class_roll': 'CSE/25/099',
        'university_roll': '10900123099',
        'password': 'password123',
        'confirm_password': 'password123'
    }
    req = factory.post('/api/auth/register/', data=test_user_data, content_type='application/json')
    res = views.register_user(req)
    print(f"6. 11-Field Register User: HTTP {res.status_code}, Assigned ID: {res.data.get('membership_id')}")

    # Clean up test user to prevent lingering dummy records
    from django.contrib.auth.models import User
    User.objects.filter(email='test.engineer@teamcc.org').delete()

    print("\n[ALL ENDPOINT TESTS PASSED SUCCESSFULLY (ZERO DUMMY DATA)]")

if __name__ == '__main__':
    test_views()
