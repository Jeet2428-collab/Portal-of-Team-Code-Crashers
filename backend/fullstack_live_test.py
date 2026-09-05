import urllib.request
import json
import urllib.error

FRONTEND_URL = "http://127.0.0.1:5173/"
BACKEND_URL = "http://127.0.0.1:8000"

def send_request(url, method="GET", data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    req_data = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req, timeout=10) as res:
            body = res.read().decode("utf-8")
            try:
                return res.status, json.loads(body)
            except Exception:
                return res.status, body
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, body

def run_fullstack_tests():
    print("=" * 60)
    print("LIVE FULLSTACK END-TO-END VERIFICATION")
    print("=" * 60)

    # 1. Frontend Server Check
    print("\n[1] Checking Vite Frontend Server (http://127.0.0.1:5173/)...")
    status, body = send_request(FRONTEND_URL)
    assert status == 200, f"Frontend failed with HTTP {status}"
    print(f"    [OK] Frontend React app serving successfully (HTTP {status}).")

    # 2. Backend Admin Status Check
    print("\n[2] Checking Django Backend Status (GET /api/admin/status/)...")
    status, data = send_request(f"{BACKEND_URL}/api/admin/status/")
    assert status == 200, f"Backend status failed with HTTP {status}"
    print(f"    [OK] DB Status: {data.get('status')}, Engine: {data.get('database')}, Latency: {data.get('latency')}")
    print(f"    [OK] Roster Stats: {data.get('memberCount')} Members, {data.get('projectCount')} Projects, {data.get('noticeCount')} Notices.")

    # 3. Projects API Check
    print("\n[3] Checking Projects API (GET /api/projects/)...")
    status, data = send_request(f"{BACKEND_URL}/api/projects/")
    assert status == 200 and len(data) >= 3, f"Projects failed"
    print(f"    [OK] Received {len(data)} projects. Top initiative: {data[0].get('code')} - {data[0].get('title')} ({data[0].get('progress')}% progress)")

    # 4. Members Roster API Check
    print("\n[4] Checking Members Roster API (GET /api/members/)...")
    status, data = send_request(f"{BACKEND_URL}/api/members/")
    assert status == 200 and len(data) >= 1, f"Members roster failed"
    print(f"    [OK] Received {len(data)} members. Sample card: {data[0].get('member_id')} ({data[0].get('role')})")

    # 5. Active Notice Sheets API Check
    print("\n[5] Checking Notice Sheets API (GET /api/attendance/notices/)...")
    status, data = send_request(f"{BACKEND_URL}/api/attendance/notices/")
    assert status == 200 and len(data) >= 1, f"Notices failed"
    print(f"    [OK] Received {len(data)} notices. Latest notice: '{data[0].get('title')}'")

    # 6. Admin Login with JWT Token (ltAdmin@teamcc / cc25?MP)
    print("\n[6] Testing Admin Login (POST /api/auth/token/)...")
    admin_login_payload = {
        "username": "ltAdmin@teamcc",
        "password": "cc25?MP"
    }
    status, data = send_request(f"{BACKEND_URL}/api/auth/token/", method="POST", data=admin_login_payload)
    assert status == 200 and "access" in data, f"Admin login failed"
    admin_token = data["access"]
    print(f"    [OK] Login successful! Admin: {data['user']['name']}, Role: {data['user']['role']}")
    print(f"    [OK] JWT Bearer Token obtained: {admin_token[:30]}...")

    # 7. 11-Field Member Onboarding Flow
    print("\n[7] Testing 11-Field Member Registration (POST /api/auth/register/)...")
    import random
    rand_id = random.randint(1000, 9999)
    new_member_payload = {
        "name": f"Priya Sharma {rand_id}",
        "email": f"priya{rand_id}@teamcc.org",
        "contact": "9845123999",
        "gender": "Female",
        "department": "CSE",
        "year": "2nd Year",
        "sem": "3rd Semester",
        "class_roll": f"CSE/25/{rand_id}",
        "university_roll": f"10900125{rand_id}",
        "password": "memberPassword123",
        "confirm_password": "memberPassword123"
    }
    status, data = send_request(f"{BACKEND_URL}/api/auth/register/", method="POST", data=new_member_payload)
    assert status == 201, f"Registration failed with {status}: {data}"
    generated_id = data.get("membership_id")
    member_token = data.get("access")
    print(f"    [OK] 11-field registration succeeded! Assigned 1-Year ID: {generated_id}")
    print(f"    [OK] Generated user credentials verified for {data['user']['email']}.")

    # 8. Member Login via Newly Generated Membership ID
    print(f"\n[8] Testing Login via Membership ID ({generated_id})...")
    id_login_payload = {
        "username": generated_id,
        "password": "memberPassword123"
    }
    status, data = send_request(f"{BACKEND_URL}/api/auth/token/", method="POST", data=id_login_payload)
    assert status == 200 and "access" in data, f"Membership ID login failed"
    print(f"    [OK] Authenticated via Membership ID {generated_id}! Role: {data['user']['role']}")

    # 9. Role Promotion Test
    print("\n[9] Testing Role Promotion Engine (POST /api/admin/promotion/)...")
    promo_payload = {
        "member_id": generated_id,
        "category": "Core",
        "role": "Core Technical Associate",
        "action": "PROMOTION"
    }
    status, data = send_request(f"{BACKEND_URL}/api/admin/promotion/", method="POST", data=promo_payload, token=admin_token)
    assert status == 200 and data.get("success") is True, f"Promotion failed"
    print(f"    [OK] Member {generated_id} successfully promoted to '{data.get('role')}'!")

    print("[SUCCESS] ALL 9 FULLSTACK INTEGRATION TESTS PASSED WITH 100% SUCCESS!")

if __name__ == "__main__":
    run_fullstack_tests()
