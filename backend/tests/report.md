# Software Engineering Lab — Assignment 8 (Part A & B)

## Q1. a) Test Plan for FlowState Project

**Objective of testing:** To systematically validate the functionality, security, data integrity, and workflow orchestration of the entire FlowState platform. The testing aims to ensure that authentication is secure (JWT/hashing), role-based access control (RBAC) strictly boundaries users (Clients vs. Employees), and feature request lifecycles progress correctly from submission to completion without data leakage or system crashes.

**Scope (Modules/Features to be tested):**
* **Access & Identity Module:** User Registration (`signup`), User Authentication (`login`), Password Hashing (`bcrypt/SHA256`), and JWT Token generation/validation.
* **Feature Request Management Module:** Submission (`POST`), Retrieval (`GET`), and Deletion (`DELETE`) of client feature requests.
* **Workflow & Orchestration Module:** Status lifecycle transitions (e.g., `PENDING` → `APPROVED` → `IN_PROGRESS`), and Dashboard statistics calculation.
* **Security & Validation Module:** Role-Based Access Control (RBAC) enforcement, Input sanitization (XSS prevention), and schema validation.
* **Out-of-Scope:** UI/Frontend rendering tests, stress/load testing, and database replication testing.

**Types of testing to be performed:**
* **White Box Testing:** Internal logic verification, including branch coverage for signup/login conditionals, cryptographic validation of password hashes, and JWT expiry constraints.
* **Black Box Testing (System Testing):** API endpoint validation against the system requirements (SRS), ensuring correct HTTP status codes, data persistence, and proper handling of edge cases (e.g., long strings, empty payloads).
* **Security & Negative Testing:** Intentionally injecting malicious payloads (XSS), omitting required authentication headers, and attempting unauthorized role actions to test system resilience.

**Tools:**
* **Python (`requests` library):** For building the custom automated live API test runner.
* **FastAPI / Uvicorn:** Local development server for live endpoint targeting.
* **PostgreSQL / SQLAlchemy:** For validating data persistence and foreign-key constraints.
* **JSON Web Token (PyJWT):** For manual token decoding and tampering tests.

**Entry and Exit criteria:**
* **Entry Criteria:** All core application modules are merged into the main branch, the PostgreSQL database is initialized with the correct schema, and the local server is actively running on port 8000.
* **Exit Criteria:** 100% of the defined test cases (White Box and Black Box) are executed. All critical workflow paths are verified, test results are logged, and any identified high/medium severity bugs are documented for fixing.

---

## Q1. b) Designed Test Cases (Module: Feature Requests & Security)

Below is the complete suite of 12 test cases targeting the operations, validation, and security boundaries of the Feature Request module.

| Test Case ID | Test Scenario / Description | Input Data | Expected Output | Actual Output | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | **Valid Client Submission:** Verify that a Client can submit a feature request. | `POST /requests`<br>Payload: `{"title": "UI Update", "description": "Fix CSS"}`<br>Auth: Valid Client JWT | HTTP 200 OK. | HTTP 200 OK. | **Pass** |
| **TC-02** | **RBAC Enforcement (Submit):** Verify that a Manager cannot submit a feature request. | `POST /requests`<br>Payload: `{"title": "Hack", "description": "Desc"}`<br>Auth: Valid Manager JWT | HTTP 403 Forbidden. | HTTP 403 Forbidden. | **Pass** |
| **TC-03** | **Invalid Token Verification:** Verify the system rejects malformed or invalid authentication tokens. | `POST /requests`<br>Payload: `{"title": "Test", "description": "Desc"}`<br>Auth: "invalid_token_string" | HTTP 401 Unauthorized. | HTTP 401 Unauthorized. | **Pass** |
| **TC-04** | **Valid Data Retrieval:** Verify an authenticated user can view the list of requests. | `GET /requests`<br>Auth: Valid Client JWT | HTTP 200 OK. | HTTP 200 OK. | **Pass** |
| **TC-05** | **Unauthenticated Access:** Verify the system blocks unauthenticated users from viewing requests. | `GET /requests`<br>Auth: None (No Header) | HTTP 401 Unauthorized. | HTTP 401 Unauthorized. | **Pass** |
| **TC-06** | **RBAC Enforcement (Update):** Verify that a Client cannot update task statuses. | `PATCH /requests/1/status`<br>Params: `status="IN_PROGRESS"`<br>Auth: Valid Client JWT | HTTP 403 Forbidden. | HTTP 403 Forbidden. | **Pass** |
| **TC-07** | **Enum Schema Validation:** Verify the API rejects status updates outside the defined lifecycle. | `PATCH /requests/1/status`<br>Params: `status="FLYING_CAR"`<br>Auth: Valid Manager JWT | HTTP 400 or 422. | HTTP 400 Bad Request. | **Pass** |
| **TC-08** | **Empty Payload Handling:** Verify the API rejects submissions with missing required fields. | `POST /requests`<br>Payload: `{}`<br>Auth: Valid Client JWT | HTTP 422 Unprocessable Entity. | HTTP 422 Unprocessable Entity. | **Pass** |
| **TC-09** | **Input Sanitization (XSS):** Verify the system sanitizes or rejects malicious HTML/JS payloads. | `POST /requests`<br>Payload: `{"title": "<script>alert(1)</script>", "description": "Inject"}`<br>Auth: Valid Client JWT | HTTP 400 or 422. | HTTP 200 OK. (Payload accepted) | **Fail** |
| **TC-10** | **Valid Status Update:** Verify a Manager can successfully update a request status. | `PATCH /requests/1/status`<br>Params: `status="APPROVED"`<br>Auth: Valid Manager JWT | HTTP 200 OK. | HTTP 200 OK. | **Pass** |
| **TC-11** | **Strict Type Enforcement:** Verify the API rejects incorrect data types (e.g., integers instead of strings). | `POST /requests`<br>Payload: `{"title": 12345, "description": 9876}`<br>Auth: Valid Client JWT | HTTP 422 Unprocessable Entity. | HTTP 422 Unprocessable Entity. | **Pass** |
| **TC-12** | **Secure Deletion:** Verify that deleting a request requires proper authentication. | `DELETE /requests/1`<br>Auth: None (No Header) | HTTP 401 Unauthorized. | HTTP 404 Not Found. | **Fail** |

---

## Q2. a) Execute the test cases designed above and document the results
    - Screenshots attached for the same

## Q2. b) Defect (Bug) Analysis

During the execution of the test suite, three distinct defects were identified regarding input sanitization, API routing logic, and cryptographic configuration.

### **Defect 1: Cross-Site Scripting (XSS) Vulnerability**
* **Bug ID:** BUG-SEC-001
* **Description of the issue:** The `POST /requests` endpoint does not sanitize incoming string payloads. It accepts raw HTML/JavaScript tags (e.g., `<script>`), which will be stored in the database and potentially executed when rendered on the Manager's frontend dashboard.
* **Steps to reproduce:** Authenticate as a Client. Send a POST request to `/requests` with `{"title": "<script>alert('XSS')</script>", "description": "test"}`.
* **Expected vs Actual Result:** Expected HTTP 400 (Bad Request) indicating invalid characters. Actual result is HTTP 200 OK.
* **Severity level:** High
* **Suggested fix:** Implement a Pydantic validator on the `FeatureRequestCreate` schema to strip HTML tags, or use a library like `bleach` to sanitize strings before they reach the SQLAlchemy database layer.

### **Defect 2: Improper Error Handling (State Leakage) on DELETE**
* **Bug ID:** BUG-API-002
* **Description of the issue:** When an unauthenticated user attempts to hit the `DELETE /requests/{id}` endpoint, the server returns a 404 Not Found instead of a 401 Unauthorized. This violates security best practices, as it allows attackers to enumerate which request IDs exist in the database without being logged in.
* **Steps to reproduce:** Without passing a JWT token, send `DELETE /requests/1`.
* **Expected vs Actual Result:** Expected HTTP 401 (Unauthorized) indicating the user must log in first. Actual result is HTTP 404.
* **Severity level:** Medium
* **Suggested fix:** In the FastAPI route definition, ensure the `Depends(get_current_user)` dependency is evaluated before the database queries for the requested ID.

### **Defect 3: Insecure JWT Secret Key Length**
* **Bug ID:** BUG-CONF-003
* **Description of the issue:** Discovered via server console audit logs during testing. The PyJWT library throws an `InsecureKeyLengthWarning` because the HMAC secret key used to sign the tokens is only 14 bytes long, which is below the RFC 7518 recommended minimum of 32 bytes for SHA256.
* **Steps to reproduce:** Trigger any endpoint that calls `jwt.encode()` or `jwt.decode()` (e.g., `/auth/login`) and observe the Uvicorn server logs.
* **Expected vs Actual Result:** Expected silent token generation. Actual result is an active security warning in the server environment.
* **Severity level:** Medium
* **Suggested fix:** Update the `.env` file or `security.py` configuration to use a cryptographically secure, 32+ byte string (e.g., generated via `openssl rand -hex 32`).