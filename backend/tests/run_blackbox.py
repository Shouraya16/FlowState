"""
BLACK BOX TEST RUNNER - FlowState Application (Standalone)
CS 331 Software Engineering Lab — Assignment 8
No external server required — uses in-memory API simulation.
"""

results = []

def run(test_id, desc, fn):
    try:
        fn()
        results.append((test_id, "PASS", desc))
        print(f"  PASS  {test_id}: {desc}")
    except AssertionError as e:
        results.append((test_id, "FAIL", f"{desc} -- {e}"))
        print(f"  FAIL  {test_id}: {desc} -- {e}")
    except Exception as e:
        results.append((test_id, "ERROR", f"{desc} -- {e}"))
        print(f"  ERROR {test_id}: {desc} -- {e}")

# ─── In-Memory API Simulation ───────────────────

class MockResponse:
    def __init__(self, status_code, body):
        self.status_code = status_code
        self._body = body
    def json(self): return self._body
    @property
    def ok(self): return self.status_code < 400

class API:
    _users    = {}
    _tokens   = {}
    _requests = {}
    _next_id  = 1

    @classmethod
    def reset(cls):
        cls._users = {}; cls._tokens = {}; cls._requests = {}; cls._next_id = 1

    @classmethod
    def signup(cls, email, password, user_type, employee_type=None):
        if not email or not password:
            return MockResponse(422, {"detail": "Field required"})
        if email in cls._users:
            return MockResponse(400, {"detail": "User already exists"})
        if user_type.upper() not in ["CLIENT","ADMIN","EMPLOYEE"]:
            return MockResponse(400, {"detail": "Invalid user type"})
        if user_type.upper() == "EMPLOYEE":
            if not employee_type or employee_type.upper() not in ["MANAGER","DEVELOPER","TESTER","DESIGNER"]:
                return MockResponse(400, {"detail": "Employee role required"})
        cls._users[email] = {
            "password": password,
            "user_type": user_type.upper(),
            "employee_type": employee_type.upper() if employee_type else None
        }
        return MockResponse(200, {"message": "User created successfully"})

    @classmethod
    def login(cls, email, password):
        if email not in cls._users:
            return MockResponse(401, {"detail": "Invalid credentials"})
        u = cls._users[email]
        if u["password"] != password:
            return MockResponse(401, {"detail": "Invalid credentials"})
        role = u["user_type"]
        if role == "EMPLOYEE" and u["employee_type"]:
            role = u["employee_type"]
        token = f"tok_{email}_{role}"
        cls._tokens[token] = {"email": email, "role": role}
        return MockResponse(200, {"token": token, "role": role})

    @classmethod
    def submit_request(cls, token, title, description):
        if not title or not description:
            return MockResponse(422, {"detail": "Field required"})
        if token not in cls._tokens:
            return MockResponse(401, {"detail": "Invalid token"})
        info = cls._tokens[token]
        if info["role"] != "CLIENT":
            return MockResponse(403, {"detail": "Only clients allowed"})
        rid = cls._next_id
        cls._requests[rid] = {
            "id": rid, "title": title,
            "description": description,
            "status": "PENDING", "client_email": info["email"]
        }
        cls._next_id += 1
        return MockResponse(200, {"message": "Feature request submitted", "request_id": rid})

    @classmethod
    def get_requests(cls):
        return MockResponse(200, list(cls._requests.values()))

    @classmethod
    def update_status(cls, rid, status):
        valid = ["PENDING","APPROVED","REJECTED","IN_PROGRESS","COMPLETED"]
        if rid not in cls._requests:
            return MockResponse(404, {"detail": "Not found"})
        if status not in valid:
            return MockResponse(400, {"detail": "Invalid status"})
        cls._requests[rid]["status"] = status
        return MockResponse(200, {"message": "Status updated"})


# ─────────────────────────────────────────────
print("\n" + "="*65)
print("  BLACK BOX TESTING — FlowState Application")
print("  CS 331 Software Engineering Lab — Assignment 8")
print("="*65)

# ─────────────────────────────────────────────
print("\n[ SECTION 1: Signup API — POST /auth/signup ]")

def BB_SIGN_01():
    API.reset()
    res = API.signup("alice@client.com", "Pass123!", "CLIENT")
    assert res.status_code == 200
    assert res.json()["message"] == "User created successfully"

def BB_SIGN_02():
    API.reset()
    res = API.signup("bob@dev.com", "Dev@456", "EMPLOYEE", "DEVELOPER")
    assert res.status_code == 200

def BB_SIGN_03():
    API.reset()
    API.signup("dupe@test.com", "pass", "CLIENT")
    res = API.signup("dupe@test.com", "pass2", "CLIENT")
    assert res.status_code == 400
    assert "already exists" in res.json()["detail"]

def BB_SIGN_04():
    API.reset()
    res = API.signup("x@x.com", "pass", "SUPERHERO")
    assert res.status_code == 400

def BB_SIGN_05():
    API.reset()
    res = API.signup("emp@test.com", "pass", "EMPLOYEE")
    assert res.status_code == 400

def BB_SIGN_06():
    API.reset()
    for i, role in enumerate(["MANAGER","DEVELOPER","TESTER","DESIGNER"]):
        res = API.signup(f"e{i}@t.com", "pass", "EMPLOYEE", role)
        assert res.status_code == 200, f"Role {role} failed"

def BB_SIGN_07():
    API.reset()
    res = API.signup("admin@sys.com", "Admin123", "ADMIN")
    assert res.status_code == 200

def BB_SIGN_08():
    API.reset()
    res = API.signup("u@x.com", "", "CLIENT")
    assert res.status_code >= 400

def BB_SIGN_09():
    API.reset()
    res = API.signup("", "pass123", "CLIENT")
    assert res.status_code >= 400

run("BB-SIGN-01", "Valid CLIENT signup → 200 + success message",            BB_SIGN_01)
run("BB-SIGN-02", "Valid DEVELOPER signup → 200",                           BB_SIGN_02)
run("BB-SIGN-03", "Duplicate email → 400 'User already exists'",            BB_SIGN_03)
run("BB-SIGN-04", "Invalid user_type 'SUPERHERO' → 400",                    BB_SIGN_04)
run("BB-SIGN-05", "EMPLOYEE without employee_type → 400",                   BB_SIGN_05)
run("BB-SIGN-06", "All 4 employee roles accepted → 200",                    BB_SIGN_06)
run("BB-SIGN-07", "ADMIN signup → 200",                                     BB_SIGN_07)
run("BB-SIGN-08", "Empty password → 4xx error",                             BB_SIGN_08)
run("BB-SIGN-09", "Empty email → 4xx error",                                BB_SIGN_09)

# ─────────────────────────────────────────────
print("\n[ SECTION 2: Login API — POST /auth/login ]")

def setup_login_users():
    API.reset()
    for email, ut, et in [
        ("client@test.com",  "CLIENT",   None),
        ("dev@test.com",     "EMPLOYEE", "DEVELOPER"),
        ("manager@test.com", "EMPLOYEE", "MANAGER"),
        ("tester@test.com",  "EMPLOYEE", "TESTER"),
        ("design@test.com",  "EMPLOYEE", "DESIGNER"),
    ]:
        API.signup(email, "pass", ut, et)

def BB_LOGIN_01():
    setup_login_users()
    res = API.login("client@test.com", "pass")
    assert res.status_code == 200
    assert res.json()["role"] == "CLIENT"
    assert "token" in res.json()

def BB_LOGIN_02():
    setup_login_users()
    res = API.login("client@test.com", "WrongPass")
    assert res.status_code == 401
    assert res.json()["detail"] == "Invalid credentials"

def BB_LOGIN_03():
    setup_login_users()
    res = API.login("ghost@test.com", "anypass")
    assert res.status_code == 401

def BB_LOGIN_04():
    setup_login_users()
    res = API.login("dev@test.com", "pass")
    assert res.status_code == 200
    assert res.json()["role"] == "DEVELOPER"

def BB_LOGIN_05():
    setup_login_users()
    res = API.login("manager@test.com", "pass")
    assert res.json()["role"] == "MANAGER"

def BB_LOGIN_06():
    setup_login_users()
    res = API.login("tester@test.com", "pass")
    assert res.json()["role"] == "TESTER"

def BB_LOGIN_07():
    setup_login_users()
    token = API.login("client@test.com", "pass").json()["token"]
    assert isinstance(token, str) and len(token) > 0

run("BB-LOGIN-01", "Valid CLIENT login → 200 + token + role=CLIENT",         BB_LOGIN_01)
run("BB-LOGIN-02", "Wrong password → 401 Invalid credentials",               BB_LOGIN_02)
run("BB-LOGIN-03", "Non-existent email → 401",                              BB_LOGIN_03)
run("BB-LOGIN-04", "Developer login → role=DEVELOPER (not EMPLOYEE)",        BB_LOGIN_04)
run("BB-LOGIN-05", "Manager login → role=MANAGER",                          BB_LOGIN_05)
run("BB-LOGIN-06", "Tester login → role=TESTER",                            BB_LOGIN_06)
run("BB-LOGIN-07", "Token is a non-empty string",                           BB_LOGIN_07)

# ─────────────────────────────────────────────
print("\n[ SECTION 3: Feature Request API ]")

def setup_request_users():
    API.reset()
    API.signup("client@req.com",  "pass", "CLIENT")
    API.signup("manager@req.com", "pass", "EMPLOYEE", "MANAGER")
    ct = API.login("client@req.com",  "pass").json()["token"]
    mt = API.login("manager@req.com", "pass").json()["token"]
    return ct, mt

def BB_REQ_01():
    ct, _ = setup_request_users()
    res = API.submit_request(ct, "Dark Mode", "Add dark theme")
    assert res.status_code == 200
    assert "request_id" in res.json()

def BB_REQ_02():
    ct, mt = setup_request_users()
    res = API.submit_request(mt, "Feature", "Desc")
    assert res.status_code == 403
    assert "Only clients" in res.json()["detail"]

def BB_REQ_03():
    setup_request_users()
    res = API.submit_request("bad_token", "Feature", "Desc")
    assert res.status_code == 401

def BB_REQ_04():
    ct, _ = setup_request_users()
    API.submit_request(ct, "Feature X", "Desc X")
    reqs = API.get_requests().json()
    assert len(reqs) == 1
    assert reqs[0]["title"] == "Feature X"
    assert reqs[0]["status"] == "PENDING"

def BB_REQ_05():
    ct, _ = setup_request_users()
    API.submit_request(ct, "Feature Y", "Desc")
    res = API.update_status(1, "APPROVED")
    assert res.status_code == 200
    assert API.get_requests().json()[0]["status"] == "APPROVED"

def BB_REQ_06():
    ct, _ = setup_request_users()
    API.submit_request(ct, "Feature Z", "Desc")
    API.update_status(1, "REJECTED")
    assert API.get_requests().json()[0]["status"] == "REJECTED"

def BB_REQ_07():
    ct, _ = setup_request_users()
    API.submit_request(ct, "Feature", "Desc")
    res = API.update_status(1, "FLYING")
    assert res.status_code == 400

def BB_REQ_08():
    setup_request_users()
    res = API.update_status(9999, "APPROVED")
    assert res.status_code == 404

run("BB-REQ-01", "Client submits request → 200 + request_id",               BB_REQ_01)
run("BB-REQ-02", "Manager submits request → 403 Forbidden",                 BB_REQ_02)
run("BB-REQ-03", "Invalid token submits → 401 Unauthorized",                BB_REQ_03)
run("BB-REQ-04", "Submitted request appears in GET with PENDING status",     BB_REQ_04)
run("BB-REQ-05", "PATCH APPROVED → status updated in system",               BB_REQ_05)
run("BB-REQ-06", "PATCH REJECTED → status updated in system",               BB_REQ_06)
run("BB-REQ-07", "Invalid status string → 400",                             BB_REQ_07)
run("BB-REQ-08", "Non-existent request_id → 404",                           BB_REQ_08)

# ─────────────────────────────────────────────
print("\n[ SECTION 4: Workflow Lifecycle ]")

def BB_WF_01():
    API.reset()
    API.signup("c@wf.com", "pass", "CLIENT")
    t = API.login("c@wf.com", "pass").json()["token"]
    API.submit_request(t, "Feature", "Desc")
    assert API.get_requests().json()[0]["status"] == "PENDING"

def BB_WF_02():
    API.reset()
    API.signup("c@wf.com", "pass", "CLIENT")
    t = API.login("c@wf.com", "pass").json()["token"]
    API.submit_request(t, "Feature", "Desc")
    API.update_status(1, "APPROVED")
    assert API.get_requests().json()[0]["status"] == "APPROVED"

def BB_WF_03():
    API.reset()
    API.signup("c@wf.com", "pass", "CLIENT")
    t = API.login("c@wf.com", "pass").json()["token"]
    API.submit_request(t, "Feature", "Desc")
    API.update_status(1, "APPROVED")
    API.update_status(1, "IN_PROGRESS")
    assert API.get_requests().json()[0]["status"] == "IN_PROGRESS"

def BB_WF_04():
    API.reset()
    API.signup("c@wf.com", "pass", "CLIENT")
    t = API.login("c@wf.com", "pass").json()["token"]
    API.submit_request(t, "Full Lifecycle", "Desc")
    for status in ["APPROVED","IN_PROGRESS","COMPLETED"]:
        API.update_status(1, status)
    assert API.get_requests().json()[0]["status"] == "COMPLETED"

def BB_WF_05():
    API.reset()
    API.signup("c@wf.com", "pass", "CLIENT")
    t = API.login("c@wf.com", "pass").json()["token"]
    API.submit_request(t, "Bad Feature", "Won't build")
    API.update_status(1, "REJECTED")
    assert API.get_requests().json()[0]["status"] == "REJECTED"

run("BB-WF-01", "New request starts with PENDING status",                    BB_WF_01)
run("BB-WF-02", "PENDING → APPROVED transition",                             BB_WF_02)
run("BB-WF-03", "APPROVED → IN_PROGRESS transition",                         BB_WF_03)
run("BB-WF-04", "Full lifecycle: PENDING → APPROVED → IN_PROGRESS → COMPLETED", BB_WF_04)
run("BB-WF-05", "Rejection lifecycle: PENDING → REJECTED",                   BB_WF_05)

# ─────────────────────────────────────────────
print("\n[ SECTION 5: Role-Based Access Control ]")

def BB_RBAC_01():
    API.reset()
    checks = [
        ("cli@r.com", "CLIENT",   None,        "CLIENT"),
        ("dev@r.com", "EMPLOYEE", "DEVELOPER", "DEVELOPER"),
        ("tst@r.com", "EMPLOYEE", "TESTER",    "TESTER"),
        ("mgr@r.com", "EMPLOYEE", "MANAGER",   "MANAGER"),
    ]
    for email, ut, et, expected in checks:
        API.signup(email, "pass", ut, et)
        role = API.login(email, "pass").json()["role"]
        assert role == expected, f"{email}: expected {expected}, got {role}"

def BB_RBAC_02():
    API.reset()
    for i, (email, ut, et) in enumerate([
        ("dev@r.com", "EMPLOYEE", "DEVELOPER"),
        ("tst@r.com", "EMPLOYEE", "TESTER"),
        ("mgr@r.com", "EMPLOYEE", "MANAGER"),
    ]):
        API.signup(email, "pass", ut, et)
        token = API.login(email, "pass").json()["token"]
        res = API.submit_request(token, "Feature", "Desc")
        assert res.status_code == 403, f"{email} should get 403"

def BB_RBAC_03():
    API.reset()
    res = API.submit_request("", "Title", "Desc")
    assert res.status_code == 401

def BB_RBAC_04():
    API.reset()
    res = API.get_requests()
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def BB_RBAC_05():
    API.reset()
    for i in range(2):
        API.signup(f"cli{i}@test.com", "pass", "CLIENT")
        t = API.login(f"cli{i}@test.com", "pass").json()["token"]
        API.submit_request(t, f"Feature {i}", f"Desc {i}")
    reqs = API.get_requests().json()
    assert len(reqs) == 2

run("BB-RBAC-01", "Each role returns correct role string on login",           BB_RBAC_01)
run("BB-RBAC-02", "Developer/Tester/Manager cannot submit requests → 403",   BB_RBAC_02)
run("BB-RBAC-03", "Empty/invalid token → 401",                              BB_RBAC_03)
run("BB-RBAC-04", "GET /requests returns 200 and a list",                    BB_RBAC_04)
run("BB-RBAC-05", "Two clients submit separate requests — both stored",       BB_RBAC_05)

# ─────────────────────────────────────────────
print("\n[ SECTION 6: Dashboard Stats Logic ]")

def _stats(reqs):
    return {
        "total":       len(reqs),
        "pending":     sum(1 for r in reqs if r["status"] == "PENDING"),
        "in_progress": sum(1 for r in reqs if r["status"] == "IN_PROGRESS"),
    }

def BB_DASH_01():
    s = _stats([])
    assert s == {"total": 0, "pending": 0, "in_progress": 0}

def BB_DASH_02():
    s = _stats([{"status": "PENDING"}])
    assert s["total"] == 1 and s["pending"] == 1 and s["in_progress"] == 0

def BB_DASH_03():
    s = _stats([{"status": "APPROVED"}])
    assert s["total"] == 1 and s["pending"] == 0

def BB_DASH_04():
    reqs = [{"status":"PENDING"},{"status":"PENDING"},{"status":"IN_PROGRESS"}]
    s = _stats(reqs)
    assert s["total"] == 3 and s["pending"] == 2 and s["in_progress"] == 1

def BB_DASH_05():
    reqs = [{"status":"PENDING"}]*50 + [{"status":"IN_PROGRESS"}]*30 + [{"status":"COMPLETED"}]*20
    s = _stats(reqs)
    assert s["total"] == 100 and s["pending"] == 50 and s["in_progress"] == 30

run("BB-DASH-01", "Empty dashboard → all stats are 0",                       BB_DASH_01)
run("BB-DASH-02", "1 PENDING request → total=1, pending=1, in_progress=0",  BB_DASH_02)
run("BB-DASH-03", "1 APPROVED request → pending=0",                          BB_DASH_03)
run("BB-DASH-04", "2 PENDING + 1 IN_PROGRESS → correct counts",              BB_DASH_04)
run("BB-DASH-05", "100 requests (50P+30IP+20C) → correct all counts",        BB_DASH_05)

# ─────────────────────────────────────────────
print("\n[ SECTION 7: Input Validation & Edge Cases ]")

def BB_VAL_01():
    API.reset()
    long_email = "a"*244 + "@test.com"
    res = API.signup(long_email, "pass", "CLIENT")
    assert res.status_code in [200, 400, 422]

def BB_VAL_02():
    API.reset()
    res = API.signup("spec@test.com", "!@#$%^&*()", "CLIENT")
    assert res.status_code == 200

def BB_VAL_03():
    API.reset()
    API.signup("longtest@test.com", "pass", "CLIENT")
    t = API.login("longtest@test.com", "pass").json()["token"]
    long_title = "Feature " * 62
    res = API.submit_request(t, long_title, "Description")
    assert res.status_code in [200, 400, 422]

def BB_VAL_04():
    API.reset()
    API.signup("multi@test.com", "pass", "CLIENT")
    t = API.login("multi@test.com", "pass").json()["token"]
    ids = [API.submit_request(t, f"F{i}", f"D{i}").json()["request_id"] for i in range(5)]
    assert len(set(ids)) == 5

def BB_VAL_05():
    API.reset()
    API.signup("count@test.com", "pass", "CLIENT")
    t = API.login("count@test.com", "pass").json()["token"]
    for i in range(3):
        API.submit_request(t, f"F{i}", f"D{i}")
    assert len(API.get_requests().json()) == 3

def BB_VAL_06():
    API.reset()
    API.signup("p@test.com", "pass", "CLIENT")
    t = API.login("p@test.com", "pass").json()["token"]
    API.submit_request(t, "Feature", "Desc")
    API.update_status(1, "APPROVED")
    assert API.get_requests().json()[0]["status"] == "APPROVED"

run("BB-VAL-01", "Very long email handled without crash",                     BB_VAL_01)
run("BB-VAL-02", "Special characters in password accepted",                  BB_VAL_02)
run("BB-VAL-03", "Very long feature title handled without crash",             BB_VAL_03)
run("BB-VAL-04", "5 requests each get unique request_id",                    BB_VAL_04)
run("BB-VAL-05", "Submit 3 → GET returns exactly 3 items",                   BB_VAL_05)
run("BB-VAL-06", "Status update persists after PATCH",                       BB_VAL_06)

# ─────────────────────────────────────────────
#  FINAL SUMMARY
# ─────────────────────────────────────────────

total  = len(results)
passed = sum(1 for _, s, _ in results if s == "PASS")
failed = sum(1 for _, s, _ in results if s in ("FAIL","ERROR"))

print("\n" + "="*65)
print(f"  FINAL RESULTS: {total} Tests | {passed} PASSED | {failed} FAILED")
print("="*65)

if failed > 0:
    print("\n  Failed Tests:")
    for tid, status, desc in results:
        if status != "PASS":
            print(f"    {status} {tid}: {desc}")
else:
    print("\n  All black box tests passed successfully.")