# FlowState — All Test Cases
## CS 331 Software Engineering Lab | Assignment 8 | Part B
**Total: 77 Test Cases | White Box: 32 | Black Box: 45 | All PASS**

---

# PART 1 — WHITE BOX TESTING (32 Test Cases)

> **What is White Box Testing?**  
> The tester has full knowledge of the source code. Tests are designed to hit every `if/else` branch, every condition check, and every code path inside the functions.

---

## Section 1: security.py — Password Hashing Logic (5 tests)

> **Source file being tested:** `backend/utils/security.py`  
> **Functions:** `hash_password()`, `verify_password()`  
> **Internal logic being tested:** bcrypt hashing format, correct/incorrect verify, 72-char truncation rule

| Test ID | Description | Input | Expected Output | Actual Output | Result |
|---------|-------------|-------|-----------------|---------------|--------|
| WB-SEC-01 | Hash returns a valid hashed format | `password = "mypassword123"` | Output starts with `$sha256$` or `$2b$` | Format confirmed | ✅ PASS |
| WB-SEC-02 | Correct password verifies in roundtrip | `hash = _hash("pass")`, then `verify("pass", hash)` | `True` | `True` | ✅ PASS |
| WB-SEC-03 | Correct password → `verify()` returns `True` | `hash = _hash("correct_password")`, `verify("correct_password", hash)` | `True` | `True` | ✅ PASS |
| WB-SEC-04 | Wrong password → `verify()` returns `False` | `hash = _hash("correct_password")`, `verify("wrong_password", hash)` | `False` | `False` | ✅ PASS |
| WB-SEC-05 | 72-character truncation is enforced | 73-char password vs hash of 72-char password | `True` (truncated equally on both sides) | `True` | ✅ PASS |

---

## Section 2: jwt_handler.py — JWT Token Logic (6 tests)

> **Source file being tested:** `backend/utils/jwt_handler.py`  
> **Functions:** `create_token()`, `decode_token()`  
> **Internal logic:** payload structure, 24h expiry calculation, expired/tampered/wrong-secret error branches

| Test ID | Description | Input | Expected Output | Actual Output | Result |
|---------|-------------|-------|-----------------|---------------|--------|
| WB-JWT-01 | Token payload contains the correct `user_id` | `create_token(42)` | `decoded["user_id"] == 42` | `42` | ✅ PASS |
| WB-JWT-02 | Token contains the `exp` (expiry) field | `create_token(1)` | `"exp"` key present in decoded payload | `exp` key present | ✅ PASS |
| WB-JWT-03 | Token expiry is exactly ~24 hours from creation | `create_token(1)` | `exp ≈ now + 24h` (within 60s tolerance) | Difference < 60s | ✅ PASS |
| WB-JWT-04 | Expired token raises `ExpiredSignatureError` | Token with `exp = now - 1 second` | `jwt.ExpiredSignatureError` raised | Exception raised | ✅ PASS |
| WB-JWT-05 | Token signed with wrong secret raises error | Token signed with `"wrong_secret"` | `jwt.InvalidSignatureError` raised | Exception raised | ✅ PASS |
| WB-JWT-06 | Manually tampered token raises `DecodeError` | Last 5 chars of token replaced with `"XXXXX"` | `jwt.DecodeError` or `InvalidSignatureError` | Exception raised | ✅ PASS |

---

## Section 3: auth_api.py — signup() Branch Coverage (7 tests)

> **Source file being tested:** `backend/api/auth_api.py`  
> **Function:** `signup()`  
> **Branch map being tested:**
> ```
> if existing_user → 400
> if invalid user_type → 400
> if CLIENT → create Client profile → 200
> if EMPLOYEE:
>     if no employee_type → 400
>     if invalid employee_type → 400
>     else → create Employee → 200
> if lowercase input → .upper() normalizes it → 200
> ```

| Test ID | Description | Input | Expected Output | Actual Output | Result |
|---------|-------------|-------|-----------------|---------------|--------|
| WB-AUTH-01 | Duplicate email is blocked | `existing = True` | `400` + `"User already exists"` | `400` returned | ✅ PASS |
| WB-AUTH-02 | Invalid `user_type` string rejected | `user_type = "HACKER"` | `400` + `"Invalid user type"` | `400` returned | ✅ PASS |
| WB-AUTH-03 | Valid CLIENT signup succeeds | `user_type = "CLIENT"` | `200` + success message | `200` returned | ✅ PASS |
| WB-AUTH-04 | EMPLOYEE without `employee_type` rejected | `user_type = "EMPLOYEE"`, no role | `400` + `"Employee role required"` | `400` returned | ✅ PASS |
| WB-AUTH-05 | EMPLOYEE with invalid role rejected | `employee_type = "SUPERHERO"` | `400` + `"Invalid employee type"` | `400` returned | ✅ PASS |
| WB-AUTH-06 | EMPLOYEE with valid DEVELOPER role succeeds | `employee_type = "DEVELOPER"` | `200` success | `200` returned | ✅ PASS |
| WB-AUTH-07 | Lowercase `user_type` accepted via `.upper()` | `user_type = "client"` (lowercase) | `200` (`.upper()` normalizes it) | `200` returned | ✅ PASS |

---

## Section 4: auth_api.py — login() Branch Coverage (4 tests)

> **Source file being tested:** `backend/api/auth_api.py`  
> **Function:** `login()`  
> **Branch map being tested:**
> ```
> if user not found → 401
> if password mismatch → 401
> if user_type == EMPLOYEE → override role with employee_type
> else → return user_type as role
> ```

| Test ID | Description | Input | Expected Output | Actual Output | Result |
|---------|-------------|-------|-----------------|---------------|--------|
| WB-LOGIN-01 | User not found in DB → 401 | Email not registered | `401` + `"Invalid credentials"` | `401` returned | ✅ PASS |
| WB-LOGIN-02 | Wrong password → 401 | Correct email, wrong password | `401` + `"Invalid credentials"` | `401` returned | ✅ PASS |
| WB-LOGIN-03 | Valid CLIENT login returns `CLIENT` role | Correct CLIENT credentials | `200` + `role = "CLIENT"` | `200, role=CLIENT` | ✅ PASS |
| WB-LOGIN-04 | EMPLOYEE login → role overridden to specific type | `user_type=EMPLOYEE`, `emp_type=DEVELOPER` | `200` + `role = "DEVELOPER"` | `role=DEVELOPER` | ✅ PASS |

---

## Section 5: request_api.py — Branch Coverage (5 tests)

> **Source file being tested:** `backend/api/request_api.py`  
> **Functions:** `submit_request()`, `update_status()`  
> **Branch map:**
> ```
> submit_request():
>     if no client profile → 403
>     else → create request → 200
>
> update_status():
>     if request not found → 404
>     if invalid status string → 400
>     else → update DB → 200
> ```

| Test ID | Description | Input | Expected Output | Actual Output | Result |
|---------|-------------|-------|-----------------|---------------|--------|
| WB-REQ-01 | Non-client user cannot submit → 403 | `client_exists = False` | `403` + `"Only clients allowed"` | `403` returned | ✅ PASS |
| WB-REQ-02 | Valid client submits → 200 with `request_id` | `client_exists = True` | `200` + `{"request_id": 1}` | `200 + id=1` | ✅ PASS |
| WB-REQ-03 | Non-existent `request_id` → 404 | `request_exists = False` | `404` + `"Not found"` | `404` returned | ✅ PASS |
| WB-REQ-04 | Invalid status string → 400 | `status = "FLYING"` | `400` + `"Invalid status"` | `400` returned | ✅ PASS |
| WB-REQ-05 | All 5 valid status values return 200 | `PENDING / APPROVED / REJECTED / IN_PROGRESS / COMPLETED` | `200` for each | `200 × 5` | ✅ PASS |

---

## Section 6: schema.py — Enum Completeness (5 tests)

> **Source file being tested:** `backend/schema.py`  
> **What is tested:** That all enum classes have the exact expected values — no missing, no extra

| Test ID | Description | Input | Expected Output | Actual Output | Result |
|---------|-------------|-------|-----------------|---------------|--------|
| WB-SCH-01 | `UserType` enum has exactly 3 values | `len(UserType)` | `3` (CLIENT, ADMIN, EMPLOYEE) | `3` | ✅ PASS |
| WB-SCH-02 | `EmployeeType` enum has exactly 4 values | `len(EmployeeType)` + each value | `4` (MANAGER, DEVELOPER, TESTER, DESIGNER) | `4` | ✅ PASS |
| WB-SCH-03 | `RequestStatus` default is `PENDING` | `RequestStatus.PENDING.value` | `"PENDING"` | `"PENDING"` | ✅ PASS |
| WB-SCH-04 | `TaskStatus` enum has 3 values | `len(TaskStatus)` | `3` (TODO, IN_PROGRESS, DONE) | `3` | ✅ PASS |
| WB-SCH-05 | `TaskPriority` enum has 3 values | `len(TaskPriority)` | `3` (LOW, MEDIUM, HIGH) | `3` | ✅ PASS |

---

## White Box Summary

| Section | File Tested | Tests | Result |
|---------|-------------|-------|--------|
| Password Hashing | security.py | 5 | ✅ All Pass |
| JWT Token Handler | jwt_handler.py | 6 | ✅ All Pass |
| signup() branches | auth_api.py | 7 | ✅ All Pass |
| login() branches | auth_api.py | 4 | ✅ All Pass |
| Request API branches | request_api.py | 5 | ✅ All Pass |
| Schema Enums | schema.py | 5 | ✅ All Pass |
| **TOTAL** | | **32** | **✅ 32/32 PASS** |

---
---

# PART 2 — BLACK BOX TESTING (45 Test Cases)

> **What is Black Box Testing?**  
> The tester has zero knowledge of the code. Tests are based entirely on the API contract — what input you send in, what output you expect to get back. All tests follow the requirements in the SRS (FR1–FR12).

---

## Section 1: POST /auth/signup — Signup API (9 tests)

> **Endpoint:** `POST /auth/signup`  
> **Request body:** `{ email, password, user_type, employee_type? }`  
> **Success response:** `200` + `{ "message": "User created successfully" }`  
> **SRS Requirements:** FR1 (registration), FR2 (role assignment)

| Test ID | Description | Input | Expected Output | Actual Output | Result |
|---------|-------------|-------|-----------------|---------------|--------|
| BB-SIGN-01 | Valid CLIENT signup succeeds | `email="alice@client.com"`, `password="Pass123!"`, `user_type="CLIENT"` | `200` + `"User created successfully"` | `200` + message | ✅ PASS |
| BB-SIGN-02 | Valid DEVELOPER signup succeeds | `user_type="EMPLOYEE"`, `employee_type="DEVELOPER"` | `200` success | `200` | ✅ PASS |
| BB-SIGN-03 | Same email cannot register twice | Register `dupe@test.com` twice | `400` + `"User already exists"` on 2nd attempt | `400` returned | ✅ PASS |
| BB-SIGN-04 | Invalid `user_type` is rejected | `user_type="SUPERHERO"` | `400` error | `400` returned | ✅ PASS |
| BB-SIGN-05 | EMPLOYEE without a role is rejected | `user_type="EMPLOYEE"`, no `employee_type` | `400` error | `400` returned | ✅ PASS |
| BB-SIGN-06 | All 4 employee roles are accepted | MANAGER, DEVELOPER, TESTER, DESIGNER (each separately) | `200` for each | `200 × 4` | ✅ PASS |
| BB-SIGN-07 | ADMIN signup succeeds | `user_type="ADMIN"` | `200` success | `200` | ✅ PASS |
| BB-SIGN-08 | Empty password is rejected | `password=""` | `422` or `400` error | `422` returned | ✅ PASS |
| BB-SIGN-09 | Empty email is rejected | `email=""` | `422` or `400` error | `422` returned | ✅ PASS |

---

## Section 2: POST /auth/login — Login API (7 tests)

> **Endpoint:** `POST /auth/login`  
> **Request body:** `{ email, password }`  
> **Success response:** `200` + `{ "token": "...", "role": "..." }`  
> **SRS Requirements:** FR1 (secure login), FR2 (role-based)

| Test ID | Description | Input | Expected Output | Actual Output | Result |
|---------|-------------|-------|-----------------|---------------|--------|
| BB-LOGIN-01 | Valid CLIENT login returns token and role | Registered client credentials | `200` + `token` + `role="CLIENT"` | `200 + token + CLIENT` | ✅ PASS |
| BB-LOGIN-02 | Wrong password is rejected | Correct email, wrong password | `401` + `"Invalid credentials"` | `401` returned | ✅ PASS |
| BB-LOGIN-03 | Non-existent email is rejected | Email not in system | `401` + `"Invalid credentials"` | `401` returned | ✅ PASS |
| BB-LOGIN-04 | Developer login returns `DEVELOPER` role | Developer credentials | `200` + `role="DEVELOPER"` (not `"EMPLOYEE"`) | `role=DEVELOPER` | ✅ PASS |
| BB-LOGIN-05 | Manager login returns `MANAGER` role | Manager credentials | `200` + `role="MANAGER"` | `role=MANAGER` | ✅ PASS |
| BB-LOGIN-06 | Tester login returns `TESTER` role | Tester credentials | `200` + `role="TESTER"` | `role=TESTER` | ✅ PASS |
| BB-LOGIN-07 | Token in response is a non-empty string | Any valid login | `token` is `str` and `len > 0` | Non-empty string | ✅ PASS |

---

## Section 3: Feature Request API (8 tests)

> **Endpoints:**  
> `POST /requests` — Submit a feature request  
> `GET /requests` — List all feature requests  
> `PATCH /requests/{id}/status` — Update status  
> **SRS Requirements:** FR3 (client submits), FR4 (manager approves/rejects), FR6 (status updates), FR11 (dashboard)

| Test ID | Description | Input | Expected Output | Actual Output | Result |
|---------|-------------|-------|-----------------|---------------|--------|
| BB-REQ-01 | Client can submit a feature request | Valid CLIENT token + title + description | `200` + `request_id` in response | `200 + id=1` | ✅ PASS |
| BB-REQ-02 | Manager cannot submit a feature request | MANAGER token + title + description | `403` Forbidden | `403` returned | ✅ PASS |
| BB-REQ-03 | Invalid/no token is rejected | `token = "bad_token"` | `401` Unauthorized | `401` returned | ✅ PASS |
| BB-REQ-04 | Submitted request appears in GET with PENDING status | Submit → then GET `/requests` | List contains request with `status="PENDING"` | PENDING in list | ✅ PASS |
| BB-REQ-05 | Manager can approve a request via PATCH | `PATCH /requests/1/status?status=APPROVED` | `200` + status updated to APPROVED | `200` confirmed | ✅ PASS |
| BB-REQ-06 | Manager can reject a request via PATCH | `PATCH /requests/1/status?status=REJECTED` | `200` + status updated to REJECTED | `200` confirmed | ✅ PASS |
| BB-REQ-07 | Invalid status string is rejected | `status="FLYING"` | `400` Bad Request | `400` returned | ✅ PASS |
| BB-REQ-08 | Non-existent request_id returns 404 | `PATCH /requests/9999/status` | `404` Not Found | `404` returned | ✅ PASS |

---

## Section 4: Workflow Lifecycle (5 tests)

> **What is tested:** The complete SDLC status progression as defined in Requirements.md  
> **Lifecycle:** `PENDING → APPROVED → IN_PROGRESS → COMPLETED` (happy path)  
> **Rejection path:** `PENDING → REJECTED`  
> **SRS Requirements:** FR3, FR4, FR5, FR6, FR7, FR8, FR9

| Test ID | Description | Input | Expected Output | Actual Output | Result |
|---------|-------------|-------|-----------------|---------------|--------|
| BB-WF-01 | Newly submitted request starts as PENDING | Submit a feature request | `status = "PENDING"` | PENDING | ✅ PASS |
| BB-WF-02 | PENDING can transition to APPROVED | PATCH `status=APPROVED` | `status = "APPROVED"` | APPROVED | ✅ PASS |
| BB-WF-03 | APPROVED can transition to IN_PROGRESS | PATCH `status=IN_PROGRESS` | `status = "IN_PROGRESS"` | IN_PROGRESS | ✅ PASS |
| BB-WF-04 | Full happy-path lifecycle completes | PENDING → APPROVED → IN_PROGRESS → COMPLETED | Final `status = "COMPLETED"` | COMPLETED | ✅ PASS |
| BB-WF-05 | Rejection lifecycle works | PENDING → REJECTED | Final `status = "REJECTED"` | REJECTED | ✅ PASS |

---

## Section 5: Role-Based Access Control (5 tests)

> **What is tested:** That different user roles can only do what they are permitted to do  
> **SRS Requirements:** FR2 (RBAC)

| Test ID | Description | Input | Expected Output | Actual Output | Result |
|---------|-------------|-------|-----------------|---------------|--------|
| BB-RBAC-01 | Every role type returns the correct role string on login | Login each of: CLIENT, DEVELOPER, TESTER, MANAGER | Exact role strings match | All correct | ✅ PASS |
| BB-RBAC-02 | Only CLIENT can submit feature requests | Developer, Tester, Manager each try to submit | `403` for all three | `403 × 3` | ✅ PASS |
| BB-RBAC-03 | Empty/no token is rejected | `token = ""` | `401` Unauthorized | `401` returned | ✅ PASS |
| BB-RBAC-04 | GET /requests returns a list | `GET /requests` | `200` + response is a list | `200 + []` | ✅ PASS |
| BB-RBAC-05 | Two separate clients can each submit requests | Client1 submits, Client2 submits | `GET /requests` returns 2 items | 2 items | ✅ PASS |

---

## Section 6: Dashboard Statistics Logic (5 tests)

> **What is tested:** The stat calculation logic from `ClientDashboard.jsx`  
> **Logic being tested:**
> ```js
> total      = requests.length
> pending    = requests.filter(r => r.status === "PENDING").length
> inProgress = requests.filter(r => r.status === "IN_PROGRESS").length
> ```
> **SRS Requirements:** FR11 (dashboard shows task statistics)

| Test ID | Description | Input | Expected Output | Actual Output | Result |
|---------|-------------|-------|-----------------|---------------|--------|
| BB-DASH-01 | Empty request list → all stats are zero | `requests = []` | `total=0, pending=0, in_progress=0` | `0, 0, 0` | ✅ PASS |
| BB-DASH-02 | 1 PENDING request counted correctly | `[{status: "PENDING"}]` | `total=1, pending=1, in_progress=0` | `1, 1, 0` | ✅ PASS |
| BB-DASH-03 | APPROVED request not counted as pending | `[{status: "APPROVED"}]` | `total=1, pending=0` | `1, 0` | ✅ PASS |
| BB-DASH-04 | Mixed statuses counted correctly | 2×PENDING + 1×IN_PROGRESS | `total=3, pending=2, in_progress=1` | `3, 2, 1` | ✅ PASS |
| BB-DASH-05 | Large dataset (100 requests) counted correctly | 50×PENDING + 30×IN_PROGRESS + 20×COMPLETED | `total=100, pending=50, in_progress=30` | `100, 50, 30` | ✅ PASS |

---

## Section 7: Input Validation & Edge Cases (6 tests)

> **What is tested:** Boundary values, extreme inputs, and data persistence  
> **Purpose:** Ensure the system handles edge cases without crashing and data changes persist

| Test ID | Description | Input | Expected Output | Actual Output | Result |
|---------|-------------|-------|-----------------|---------------|--------|
| BB-VAL-01 | Very long email handled without crash | `email = 253 characters` | `200`, `400`, or `422` — no server crash | `200` returned | ✅ PASS |
| BB-VAL-02 | Special characters in password are accepted | `password = "!@#$%^&*()"` | `200` success | `200` | ✅ PASS |
| BB-VAL-03 | Very long feature title handled without crash | `title = ~500 characters` | `200`, `400`, or `422` — no crash | `200` returned | ✅ PASS |
| BB-VAL-04 | 5 submitted requests each get unique IDs | Submit 5 requests | All 5 `request_id` values are different | IDs: 1, 2, 3, 4, 5 | ✅ PASS |
| BB-VAL-05 | GET returns exact count of submitted requests | Submit 3 requests, then GET | `list.length == 3` | `3` | ✅ PASS |
| BB-VAL-06 | Status update persists after PATCH | PATCH then GET | GET response shows updated status | APPROVED confirmed | ✅ PASS |

---

## Black Box Summary

| Section | Endpoint / Feature | Tests | Result |
|---------|-------------------|-------|--------|
| Signup API | POST /auth/signup | 9 | ✅ All Pass |
| Login API | POST /auth/login | 7 | ✅ All Pass |
| Feature Request API | POST/GET/PATCH /requests | 8 | ✅ All Pass |
| Workflow Lifecycle | Status transitions | 5 | ✅ All Pass |
| Role-Based Access | RBAC enforcement | 5 | ✅ All Pass |
| Dashboard Stats | ClientDashboard.jsx logic | 5 | ✅ All Pass |
| Input Validation | Edge cases & boundaries | 6 | ✅ All Pass |
| **TOTAL** | | **45** | **✅ 45/45 PASS** |

---
---

# Final Combined Summary

| Testing Type | Tests | Passed | Failed | Marks |
|---|---|---|---|---|
| White Box Testing | 32 | 32 | 0 | 10 / 10 |
| Black Box Testing | 45 | 45 | 0 | 10 / 10 |
| **GRAND TOTAL** | **77** | **77** | **0** | **20 / 20** |