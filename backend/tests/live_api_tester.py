"""
LIVE API TEST RUNNER - FlowState Application
CS 331 Software Engineering Lab — Assignment 8
Executes against the running FastAPI backend with detailed HTTP logging.
"""

import requests
import time

BASE_URL = "http://127.0.0.1:8000"
results = []

def run(test_id, desc, fn):
    try:
        fn()
        results.append((test_id, "PASS", desc))
        print(f"  [RESULT] PASS  {test_id}: {desc}")
    except AssertionError as e:
        results.append((test_id, "FAIL", f"{desc} -- {e}"))
        print(f"  [RESULT] FAIL  {test_id}: {desc} -- {e}")
    except Exception as e:
        results.append((test_id, "ERROR", f"{desc} -- {e}"))
        print(f"  [RESULT] ERROR {test_id}: {desc} -- {e}")

# --- Custom HTTP Logger ---
def make_request(method, endpoint, **kwargs):
    url = f"{BASE_URL}{endpoint}"
    print(f"\n  ➤ [{method}] {url}")
    
    if "json" in kwargs:
        print(f"    Payload: {kwargs['json']}")
    if "params" in kwargs:
        print(f"    Params:  {kwargs['params']}")
        
    try:
        res = requests.request(method, url, **kwargs)
        response_snippet = (res.text[:100] + '...') if len(res.text) > 100 else res.text
        print(f"    Response: {res.status_code} | {response_snippet}")
        return res
    except requests.exceptions.ConnectionError:
        print(f"    [CRITICAL ERROR] Could not connect to {BASE_URL}. Is FastAPI running?")
        raise Exception("Server Unreachable")

# --- Setup Accounts & Tokens ---
client_token = ""
manager_token = ""

def setup_live_accounts():
    global client_token, manager_token
    print("\n" + "="*65)
    print("  INITIALIZING TEST DATA & ACCOUNTS")
    print("="*65)
    try:
        requests.post(f"{BASE_URL}/auth/signup", json={"email": "client_tc@test.com", "password": "pass", "user_type": "CLIENT"})
        requests.post(f"{BASE_URL}/auth/signup", json={"email": "manager_tc@test.com", "password": "pass", "user_type": "EMPLOYEE", "employee_type": "MANAGER"})
        
        res_c = requests.post(f"{BASE_URL}/auth/login", json={"email": "client_tc@test.com", "password": "pass"})
        if res_c.status_code == 200: client_token = res_c.json().get("token", "")
            
        res_m = requests.post(f"{BASE_URL}/auth/login", json={"email": "manager_tc@test.com", "password": "pass"})
        if res_m.status_code == 200: manager_token = res_m.json().get("token", "")
        
        print(f"  [+] Client Token acquired: {client_token[:15]}...")
        print(f"  [+] Manager Token acquired: {manager_token[:15]}...")
    except Exception:
        print("  [-] Failed to setup accounts. Ensure server is running.")

def auth_header(token):
    return {"Authorization": f"Bearer {token}"} if token else {}

# --- Test Definitions ---

def TC_01():
    res = make_request("POST", "/requests", json={"title": "UI Update", "description": "Fix CSS"}, headers=auth_header(client_token))
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"

def TC_02():
    res = make_request("POST", "/requests", json={"title": "Hack", "description": "Desc"}, headers=auth_header(manager_token))
    assert res.status_code in [403, 401], f"Expected 403, got {res.status_code}"

def TC_03():
    res = make_request("POST", "/requests", json={"title": "Test", "description": "Desc"}, headers=auth_header("invalid_token_string"))
    assert res.status_code == 401, f"Expected 401, got {res.status_code}"

def TC_04():
    res = make_request("GET", "/requests", headers=auth_header(client_token))
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"

def TC_05():
    res = make_request("GET", "/requests")
    assert res.status_code == 401, f"Expected 401 (Auth Required), got {res.status_code}"

def TC_06():
    res = make_request("PATCH", "/requests/1/status", params={"status": "IN_PROGRESS"}, headers=auth_header(client_token))
    assert res.status_code == 403, f"Expected 403 (Forbidden), got {res.status_code}"

def TC_07():
    res = make_request("PATCH", "/requests/1/status", params={"status": "FLYING_CAR"}, headers=auth_header(manager_token))
    assert res.status_code in [400, 422], f"Expected 400/422 (Bad Request), got {res.status_code}"

def TC_08():
    res = make_request("POST", "/requests", json={}, headers=auth_header(client_token))
    assert res.status_code == 422, f"Expected 422 (Validation Error), got {res.status_code}"

def TC_09():
    res = make_request("POST", "/requests", json={"title": "<script>alert(1)</script>", "description": "Inject"}, headers=auth_header(client_token))
    assert res.status_code in [400, 422], f"Expected 400 or 422 (Input Sanitization), got {res.status_code}"

def TC_10():
    res = make_request("PATCH", "/requests/1/status", params={"status": "APPROVED"}, headers=auth_header(manager_token))
    assert res.status_code == 200, f"Expected 200 OK, got {res.status_code}"

def TC_11():
    res = make_request("POST", "/requests", json={"title": 12345, "description": 9876}, headers=auth_header(client_token))
    assert res.status_code == 422, f"Expected 422 (Type Error), got {res.status_code}"

def TC_12():
    res = make_request("DELETE", "/requests/1")
    assert res.status_code == 401, f"Expected 401 (Unauthorized), got {res.status_code}"


# --- Execution ---
setup_live_accounts()
time.sleep(1)

print("\n" + "="*65)
print("  EXECUTING TEST SUITE")
print("="*65)

run("TC-01", "Client submits feature request", TC_01)
run("TC-02", "Manager cannot submit requests", TC_02)
run("TC-03", "Invalid token on submit -> 401", TC_03)
run("TC-04", "Authenticated user can view requests", TC_04)
run("TC-05", "GET /requests enforces authentication", TC_05)
run("TC-06", "Clients cannot update status -> 403", TC_06)
run("TC-07", "API rejects invalid status strings", TC_07)
run("TC-08", "API rejects empty payloads", TC_08)
run("TC-09", "API sanitizes malicious inputs", TC_09)
run("TC-10", "Manager updates status successfully", TC_10)
run("TC-11", "API strictly enforces data types", TC_11)
run("TC-12", "Unauthenticated users cannot DELETE", TC_12)

# --- Summary ---
total  = len(results)
passed = sum(1 for _, s, _ in results if s == "PASS")
failed = sum(1 for _, s, _ in results if s in ("FAIL","ERROR"))

print("\n" + "="*65)
print(f"  FINAL RESULTS: {total} Tests | {passed} PASSED | {failed} FAILED")
print("="*65)

if failed > 0:
    print("\n  Summary of Failed Tests:")
    for tid, status, desc in results:
        if status != "PASS":
            print(f"    {status} {tid}: {desc}")