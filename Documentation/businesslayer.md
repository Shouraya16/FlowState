# CS 331 — Software Engineering Lab
# Assignment 7: Business Logic Layer (BLL)
### Project: FlowState — End-to-End Software Development Workflow Automation Platform

---

## Q1. Core Functional Modules of the Business Logic Layer and Their Interaction with the Presentation Layer [10 Marks]

### What is the Business Logic Layer in FlowState?

The Business Logic Layer (BLL) in FlowState sits between the Presentation Layer (React frontend) and the Data Layer (PostgreSQL via SQLAlchemy). It is implemented as a set of FastAPI routers and helper functions located inside the `backend/api/` directory. Every action the user performs on the UI goes through this layer before anything is read from or written to the database.

---

### Core BLL Modules

#### 1. Access & Identity Module — `backend/api/auth_api.py`

This module handles all authentication and role-based access logic. It validates credentials, hashes passwords, creates JWT tokens, and resolves the correct role to return to the frontend.

**Key logic:**
- Checks if a user already exists before signup
- Hashes passwords using `bcrypt` before storing
- On login, returns not just a token but the resolved employee sub-role (e.g., DEVELOPER, TESTER) instead of just "EMPLOYEE"
```python
# auth_api.py — resolving the correct role on login
role = user.user_type.value
if role == "EMPLOYEE" and user.employee_profile:
    role = user.employee_profile.employee_type.value
return {"token": token, "role": role}
```

**Interaction with Presentation Layer:**

The `Login.jsx` component sends a POST request to `/auth/login`. On success, the BLL returns a JWT token and role string. The frontend stores both in `localStorage` and uses the role to route the user to the correct dashboard via a `switch` statement in `Dashboard.jsx`.
```jsx
// Dashboard.jsx — presentation layer reacts to BLL-returned role
switch(role){
  case "CLIENT":    return <ClientDashboard/>
  case "MANAGER":   return <ManagerDashboard/>
  case "DEVELOPER": return <DeveloperDashboard/>
  case "TESTER":    return <TesterDashboard/>
  case "DESIGNER":  return <DesignerDashboard/>
  case "ADMIN":     return <AdminDashboard/>
}
```

---

#### 2. Feature Request Module — `backend/api/request_api.py`

This module handles the ingestion of client feature requests and the manager approval/rejection workflow.

**Key logic:**
- Verifies the user is a Client before allowing submission
- Filters which requests are shown based on the role of the logged-in user (clients see only their own; managers see all)
- Blocks clients from updating request status
```python
# request_api.py — clients only see their own requests
if user.user_type == UserType.CLIENT:
    requests = db.query(FeatureRequest).filter(
        FeatureRequest.client_id == client.id
    ).all()
else:
    requests = db.query(FeatureRequest).all()
```

**Interaction with Presentation Layer:**

`ClientDashboard.jsx` calls `GET /requests` (with JWT) and renders a table of the logged-in client's own requests. `ManagerDashboard.jsx` calls the same endpoint and receives all requests, then renders Approve/Reject buttons that call `PATCH /requests/{id}/status`.

---

#### 3. Task Orchestration Module — `backend/api/task_api.py`

This is the core BLL module. It handles task creation from approved requests, intelligent developer assignment (load balancing), and task state transitions across the entire SDLC pipeline.

**Key logic:**
- Validates the feature request is APPROVED before allowing task creation
- Automatically assigns tasks to the developer with the lowest active ticket count
- When a developer marks a task as DONE, the system auto-advances it to READY_FOR_QA
- When a task passes QA, it advances to READY_TO_DEPLOY
- When a task fails QA, it reverts to IN_PROGRESS
```python
# task_api.py — smart assignment
def get_best_developer(db: Session):
    developers = db.query(Employee).filter(
        Employee.employee_type == EmployeeType.DEVELOPER
    ).all()
    best = None
    lowest = float("inf")
    for emp in developers:
        count = emp.developer_profile.active_ticket_count if emp.developer_profile else 0
        if count < lowest:
            lowest = count
            best = emp
    return best
```

**Interaction with Presentation Layer:**

`DeveloperDashboard.jsx` calls `GET /tasks/my-tasks` to display only tasks assigned to the logged-in developer. It renders "Start" and "Mark Done" buttons that call `PATCH /tasks/{id}/status`. `TesterDashboard.jsx` calls `GET /tasks/qa-tasks` to show tasks in READY_FOR_QA state, and Pass/Fail buttons call `PATCH /tasks/{id}/qa-result`.

---

#### 4. Admin Management Module — `backend/api/admin_api.py`

This module handles system-level operations — user listing, deletion, and audit log retrieval. All endpoints are protected and only accessible to users with the ADMIN role.

**Key logic:**
- `require_admin()` helper validates role before any admin operation
- Prevents an admin from deleting their own account
- Returns human-readable timestamps and resolved role names

**Interaction with Presentation Layer:**

`AdminDashboard.jsx` calls `GET /admin/users` and `GET /admin/audit-logs`. The Remove button calls `DELETE /admin/users/{id}` and immediately removes the user from the UI state without a page reload.

---

### BLL to Presentation Layer Interaction Flow

User Action (UI Button Click)

↓

React Component (e.g., ManagerDashboard.jsx)

↓

apiFetch() utility — attaches JWT token to request

↓

FastAPI Router (BLL) — validates token, checks role, applies business rules

↓

SQLAlchemy ORM — reads/writes PostgreSQL

↓

BLL formats response (transforms DB objects to JSON)

↓

React updates state → UI re-renders automatically

A single shared utility `apiFetch.js` is used by all dashboard components to ensure the JWT token is always included:
```js
// frontend/src/utils/apiFetch.js
export function apiFetch(url, options = {}) {
  const token = localStorage.getItem("token")
  return fetch(`http://localhost:8000${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      ...options.headers,
    }
  })
}
```

---

---

## Q2A. How Are Business Rules Implemented for Different Modules? [10 Marks]

Business rules are the specific conditions the system enforces to ensure operations are valid, authorized, and consistent with the application's workflow. In FlowState, business rules are implemented as guard clauses and conditional logic inside the FastAPI BLL routers.

---

### Rule 1 — Only Clients Can Submit Feature Requests

**Module:** Feature Request  
**Rule:** An employee (developer, tester, manager) cannot submit a feature request. Only users registered as CLIENT are permitted.
```python
# request_api.py
client = db.query(Client).filter(Client.user_id == user_id).first()
if not client:
    raise HTTPException(status_code=403, detail="Only clients can submit requests")
```

If the logged-in user is not a client, the system returns HTTP 403 Forbidden before touching the database.

---

### Rule 2 — Tasks Can Only Be Created from APPROVED Requests

**Module:** Task Orchestration  
**Rule:** A feature request must be explicitly approved by a manager before any development task can be created from it. Pending or rejected requests cannot generate tasks.
```python
# task_api.py
if req.status != RequestStatus.APPROVED:
    raise HTTPException(
        status_code=400,
        detail="Request must be APPROVED before creating tasks"
    )
```

This prevents premature task creation and enforces the manager approval gate in the SDLC workflow.

---

### Rule 3 — Smart Task Assignment (Workload Balancing)

**Module:** Task Orchestration  
**Rule:** Tasks are not assigned randomly. The system automatically assigns each new task to the developer with the fewest currently active tasks, ensuring fair workload distribution.
```python
# task_api.py
def get_best_developer(db: Session):
    developers = db.query(Employee).filter(
        Employee.employee_type == EmployeeType.DEVELOPER
    ).all()
    best, lowest = None, float("inf")
    for emp in developers:
        count = emp.developer_profile.active_ticket_count if emp.developer_profile else 0
        if count < lowest:
            lowest = count
            best = emp
    return best
```

After assignment, `active_ticket_count` is incremented. When the task is completed, it is decremented.

---

### Rule 4 — Clients Cannot Change Request Status

**Module:** Feature Request  
**Rule:** Only managers and admins can approve or reject requests. A client user cannot change the status of their own submitted requests.
```python
# request_api.py
if user.user_type == UserType.CLIENT:
    raise HTTPException(
        status_code=403,
        detail="Clients cannot update request status"
    )
```

---

### Rule 5 — Automatic Status Transition: DONE to READY_FOR_QA

**Module:** Task Orchestration  
**Rule:** A developer does not manually move a task to QA. When they mark a task as Done, the system automatically advances it to READY_FOR_QA, ensuring the QA stage is never skipped.
```python
# task_api.py
if new_status == TaskStatus.DONE:
    task.status = TaskStatus.READY_FOR_QA  # auto-advance, not DONE
```

---

### Rule 6 — QA Failure Reverts Task to Development

**Module:** QA and Deployment  
**Rule:** If a tester marks a task as failed, it does not remain in QA. It is automatically reverted to IN_PROGRESS so the assigned developer can fix the issues.
```python
# task_api.py
if result.lower() == "pass":
    task.status = TaskStatus.READY_TO_DEPLOY
elif result.lower() == "fail":
    task.status = TaskStatus.IN_PROGRESS  # revert to dev
```

---

### Rule 7 — Admin Cannot Delete Their Own Account

**Module:** Admin Management  
**Rule:** To prevent accidental system lockout, an admin user is not allowed to delete their own account from the user management panel.
```python
# admin_api.py
if token_data["user_id"] == user_id:
    raise HTTPException(
        status_code=400,
        detail="Cannot delete your own account"
    )
```

---

### Rule 8 — Role-Based Dashboard Routing

**Module:** Access and Identity  
**Rule:** After login, users are directed to a role-specific dashboard. No user can access another role's dashboard — the routing logic enforces this at the presentation layer.
```jsx
// Dashboard.jsx
switch(role){
  case "CLIENT":    return <ClientDashboard/>
  case "MANAGER":   return <ManagerDashboard/>
  case "DEVELOPER": return <DeveloperDashboard/>
  default:          return <h2>No Access: {role}</h2>
}
```

---

---

## Q2B. Validation Logic in FlowState [10 Marks]

Validation logic ensures that data entering the system is correct, complete, and properly formatted before it is processed or persisted. FlowState implements validation at three levels: Pydantic schema validation, backend guard clauses, and frontend HTML5 validation.

---

### Level 1 — Pydantic Schema Validation (Automatic, Framework-Level)

FastAPI uses Pydantic models to automatically validate the shape and types of incoming request bodies. If a required field is missing or of the wrong type, FastAPI returns a `422 Unprocessable Entity` error before the route function even runs.
```python
# schema.py — Pydantic model with custom validators
from pydantic import BaseModel, validator

class FeatureRequestCreate(BaseModel):
    title: str
    description: str

    @validator('title')
    def title_not_empty(cls, v):
        if len(v.strip()) < 3:
            raise ValueError('Title must be at least 3 characters')
        return v.strip()

    @validator('description')
    def description_not_empty(cls, v):
        if len(v.strip()) < 10:
            raise ValueError('Description must be at least 10 characters')
        return v.strip()
```
```python
# auth_api.py — Pydantic model for signup
class SignupRequest(BaseModel):
    email: str
    password: str
    user_type: str
    employee_type: str | None = None
```

If the frontend sends a request without a password field, FastAPI automatically rejects it with a structured error response listing the missing fields.

---

### Level 2 — Business Rule Validation (Manual Guard Clauses)

Beyond data type checking, the BLL validates business conditions manually:

**a) Email uniqueness check on signup:**
```python
# auth_api.py
existing_user = db.query(User).filter(User.email == data.email).first()
if existing_user:
    raise HTTPException(status_code=400, detail="User already exists")
```

**b) Enum validation for user_type and employee_type:**
```python
# auth_api.py
try:
    user_type_enum = UserType(data.user_type.upper())
except:
    raise HTTPException(status_code=400, detail="Invalid user type")
```
```python
try:
    emp_type_enum = EmployeeType(data.employee_type.upper())
except:
    raise HTTPException(status_code=400, detail="Invalid employee type")
```

**c) Employee must provide a role:**
```python
# auth_api.py
if not data.employee_type:
    raise HTTPException(status_code=400, detail="Employee role required")
```

**d) Task status string validated before DB write:**
```python
# task_api.py
status_map = {
    "TODO": TaskStatus.TODO,
    "IN_PROGRESS": TaskStatus.IN_PROGRESS,
    "DONE": TaskStatus.DONE,
    "READY_FOR_QA": TaskStatus.READY_FOR_QA,
    "READY_TO_DEPLOY": TaskStatus.READY_TO_DEPLOY,
}
new_status = status_map.get(status.upper())
if not new_status:
    raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
```

**e) JWT token validation on every protected route:**
```python
# jwt_handler.py
def decode_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except:
        raise HTTPException(status_code=401, detail="Invalid token")
```

Every protected endpoint uses `token_data=Depends(decode_token)`, which means an invalid or expired token is automatically rejected at the framework level before the route logic runs.

---

### Level 3 — Frontend Validation (HTML5 and React)

The presentation layer also performs client-side validation to catch errors before they are sent to the backend.

**a) Required field enforcement and email format check:**
```jsx
// Login.jsx, Signup.jsx
<input type="email" placeholder="Email" required />
<input type="password" placeholder="Password" required />
```

The `type="email"` attribute enforces proper email format. `required` prevents form submission if the field is empty.

**b) Conditional employee role dropdown:**
```jsx
// Signup.jsx
{userType === "EMPLOYEE" && (
  <select value={employeeRole} onChange={(e) => setEmployeeRole(e.target.value)} required>
    <option value="">Select Employee Role</option>
    <option value="MANAGER">Manager</option>
    <option value="DEVELOPER">Developer</option>
    <option value="TESTER">Tester</option>
    <option value="DESIGNER">Designer</option>
  </select>
)}
```

The employee role field only appears and becomes required when the user selects "Employee" as their type. This prevents submitting an employee signup without specifying the role.

**c) Token presence check on Dashboard load:**
```jsx
// Dashboard.jsx
useEffect(() => {
  if (!token) {
    navigate("/login")
  }
}, [token, navigate])
```

If a user navigates to `/dashboard` without being logged in, they are immediately redirected to the login page.

---

---

## Q2C. Data Transformation in FlowState [10 Marks]

Data transformation refers to converting data from the format it exists in at the database layer into a format that the presentation layer (React UI) can actually use and display. In FlowState, five categories of transformation are performed.

---

### Transformation 1 — SQLAlchemy ORM Objects to Plain Dictionaries to JSON

SQLAlchemy returns Python objects (instances of `User`, `Task`, `FeatureRequest`, etc.) when querying the database. These objects cannot be directly serialized to JSON — they contain lazy-loaded relationships, internal state, and complex types like Python Enum objects.

The BLL transforms them into plain dictionaries that FastAPI automatically serializes to JSON:
```python
# request_api.py — ORM object to flat dictionary
return [
    {
        "id": r.id,
        "title": r.title,
        "description": r.description,
        "status": r.status.value,     # Enum object to plain string e.g. "PENDING"
        "client_id": r.client_id
    }
    for r in requests
]
```

Without `.value`, the Enum object would serialize as `{"status": "RequestStatus.PENDING"}` — not the clean `"PENDING"` string the React UI expects.

---

### Transformation 2 — Enum Values to Readable Strings

All status and priority fields in the database are stored as SQLAlchemy Enum types. The BLL consistently extracts `.value` from every enum before returning data:
```python
# task_api.py — _format_task helper
def _format_task(t: Task):
    return {
        "id": t.id,
        "title": t.title,
        "status": t.status.value if t.status else "TODO",
        "priority": t.priority.value if t.priority else "MEDIUM",
        "git_branch": t.git_branch,
        "request_id": t.request_id,
        "assigned_to": t.assigned_to,
    }
```

The `if t.status else "TODO"` guard handles the case where the field might be `None` in the database, ensuring the UI always receives a valid string. The React UI then uses these plain strings for conditional rendering:
```jsx
// DeveloperDashboard.jsx — UI uses the transformed string directly
<span style={statusColors[task.status]}>
  {task.status?.replace("_", " ")}
</span>
```

The `.replace("_", " ")` converts `"IN_PROGRESS"` to `"IN PROGRESS"` for human-readable display.

---

### Transformation 3 — Role Resolution (Composite to Single Value)

The database stores a two-level role system: `UserType` (CLIENT, EMPLOYEE, ADMIN) and `EmployeeType` (MANAGER, DEVELOPER, TESTER, DESIGNER). The presentation layer does not know about this two-level system — it only needs one clean role string.

The BLL resolves this into a single role on login:
```python
# auth_api.py — resolving composite role into one value
role = user.user_type.value          # e.g. "EMPLOYEE"

if role == "EMPLOYEE" and user.employee_profile:
    role = user.employee_profile.employee_type.value   # resolves to "DEVELOPER", "TESTER" etc.

return {"token": token, "role": role}
```

The React frontend receives `"DEVELOPER"` instead of having to understand the nested structure. The `Dashboard.jsx` switch statement works cleanly on this single resolved value.

---

### Transformation 4 — DateTime Objects to ISO Strings

Python `datetime` objects from the database cannot be directly serialized to JSON in all cases. The BLL explicitly converts them:
```python
# admin_api.py — datetime to ISO string
{
    "id": log.id,
    "timestamp": log.timestamp.isoformat() if log.timestamp else None,
    "created_at": u.created_at.isoformat() if u.created_at else None
}
```

The `.isoformat()` call converts a Python datetime like `datetime(2025, 3, 15, 10, 30, 0)` to the string `"2025-03-15T10:30:00"`, which the React frontend can parse with `new Date(log.timestamp).toLocaleString()` for display.

---

### Transformation 5 — Relationship Flattening

Relational database data comes with nested relationships (a Task has an Employee, which has a User, which has an email). Sending the entire object graph to the frontend would expose sensitive data and create deeply nested structures the UI cannot handle. The BLL flattens this:
```python
# admin_api.py — flattening User + Employee relationship
for u in users:
    role = u.user_type.value
    if u.employee_profile:
        role = u.employee_profile.employee_type.value  # traverse relationship, extract one value

    result.append({
        "id": u.id,
        "email": u.email,
        "role": role,              # flat string, not a nested object
        "created_at": u.created_at.isoformat() if u.created_at else None
    })
```

The UI receives a flat, safe object — no password hashes, no nested relationship chains, just the fields the AdminDashboard needs to render.

---

### Summary Table of All Transformations

| Transformation | From (Database / BLL) | To (Presented to UI) | Where Applied |
|---|---|---|---|
| ORM Object to Dict | SQLAlchemy model instance | Plain JSON dict | All API routes |
| Enum to String | `TaskStatus.IN_PROGRESS` | `"IN_PROGRESS"` | task_api, request_api |
| Role Resolution | `UserType.EMPLOYEE` + `EmployeeType.DEVELOPER` | `"DEVELOPER"` | auth_api |
| DateTime to String | `datetime(2025,3,15)` | `"2025-03-15T10:30:00"` | admin_api |
| Relationship Flatten | Nested ORM joins | Flat dict with key fields only | admin_api, auth_api |
| None Safety | `None` enum value | Default string `"TODO"` or `"MEDIUM"` | task_api `_format_task` |

---
