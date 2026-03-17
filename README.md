# 🚀 FlowState

FlowState is a full-stack workflow and feature request management platform designed to streamline the lifecycle of software development tasks. It allows clients to submit feature requests, managers to review and approve them, and development teams to convert approved requests into structured tasks.

The platform integrates role-based access control, workflow orchestration, and modular application components to manage software development pipelines efficiently.

---

# 📌 Table of Contents

- Overview
- Features
- System Architecture
- Project Structure
- Tech Stack
- Application Components
- Getting Started
  - Backend Setup
  - Frontend Setup
- API Reference
- Workflow Lifecycle
- Future Improvements

---

# Overview

FlowState bridges the gap between **client feature requests and development execution**.

Instead of managing requests through emails or spreadsheets, FlowState provides a structured platform where:

1. Clients submit feature requests.
2. Managers review and approve requests.
3. Approved requests are automatically converted into development tasks.
4. Tasks are assigned to developers and tracked through completion.

The system is built using a **modular software architecture**, allowing different components such as authentication, orchestration, and notifications to work together seamlessly.

---

# Features

📋 **Feature Request Management**  
Clients can submit and track feature requests through a web interface.

🔐 **Authentication & Role-Based Access Control (RBAC)**  
Users are assigned roles (Client, Employee, Admin) and can only access permitted functionalities.

⚙ **Task Orchestration Engine**  
Automatically converts approved feature requests into development tasks.

📊 **Workflow Tracking**  
Tracks task status through stages such as TODO, IN_PROGRESS, and DONE.

🗄 **Persistent Data Storage**  
Uses PostgreSQL with SQLAlchemy ORM for structured data management.

🌐 **REST API Backend**  
FastAPI backend exposes endpoints for authentication, requests, and task management.

⚡ **Interactive Frontend**  
React-based frontend provides a responsive UI for user interaction.

---

# System Architecture

FlowState follows a **multi-layer architecture** separating presentation, business logic, and data layers.

```
Frontend (React UI)
        ↓
REST API (FastAPI Backend)
        ↓
Business Logic Components
        ↓
Data Management Layer
        ↓
PostgreSQL Database
```

This layered architecture ensures maintainability, scalability, and modular design.

---

# Project Structure

```
FlowState/
│
├── backend/
│   ├── api/                     # API routes
│   │   └── auth_api.py
│   │
│   ├── utils/                   # Utility modules
│   │   ├── security.py
│   │   └── jwt_handler.py
│   │
│   ├── models.py                # SQLAlchemy models
│   ├── database.py              # Database configuration
│   ├── main.py                  # FastAPI application entry point
│   ├── task_orchestration.py    # Workflow orchestration logic
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/          # UI components
│   │   │   └── Navbar.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── FeatureRequest.jsx
│   │   │
│   │   └── App.jsx
│   │
│   └── package.json
│
└── README.md
```

---

# Tech Stack

| Layer | Technology |
|------|-------------|
| Frontend | React.js, JavaScript, CSS |
| Backend | Python, FastAPI |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Authentication | JWT |
| Version Control | Git |

---

# Application Components

FlowState consists of multiple modular application components.

### 1. Access & Identity Component

Handles authentication and authorization.

Functions:

- User login
- User signup
- JWT token generation
- Role-based access control

---

### 2. Ingestion & Design Component

Responsible for capturing feature requests.

Functions:

- Feature request submission
- Request review
- Conversion of requests into development tasks

---

### 3. Task Orchestration Component

Coordinates workflow execution.

Functions:

- Workflow management
- Task assignment
- Task lifecycle tracking

---

### 4. Quality Assurance & Deployment Component

Manages software testing and deployment.

Functions:

- Test tracking
- Bug reporting
- Deployment triggers

---

### 5. HR & Operations Component

Handles internal operational data.

Functions:

- Employee availability tracking
- Leave management
- Activity logging

---

### 6. Notification Management Component

Sends alerts and notifications.

Functions:

- Email notifications
- Slack integration
- Status change alerts

---

### 7. Data Management Component

Responsible for database interaction.

Functions:

- Data storage
- Data retrieval
- Persistent state management

---

# Getting Started

## Prerequisites

Make sure the following software is installed:

- Python **3.9+**
- Node.js **16+**
- npm or yarn
- PostgreSQL **14+**

---

# Backend Setup

### 1. Navigate to the backend directory

```
cd backend
```

### 2. Create a virtual environment

```
python -m venv venv
```

### 3. Activate the virtual environment

Linux / macOS:

```
source venv/bin/activate
```

Windows:

```
venv\Scripts\activate
```

### 4. Install dependencies

```
pip install -r requirements.txt
```

### 5. Configure the database

Edit the database connection in:

```
backend/database.py
```

Example configuration:

```python
DATABASE_URL = "postgresql://postgres:yourpassword@localhost:5432/flowstate_db"
```

### 6. Run the backend server

```
uvicorn main:app --reload
```

The API will be available at:

```
http://localhost:8000
```

Swagger API documentation:

```
http://localhost:8000/docs
```

---

# Frontend Setup

### 1. Navigate to the frontend directory

```
cd frontend
```

### 2. Install dependencies

```
npm install
```

### 3. Start the development server

```
npm start
```

The application will run at:

```
http://localhost:3000
```

Note: Ensure the backend server is running before launching the frontend.

---

# API Reference

| Method | Endpoint | Description |
|------|-----------|-------------|
| POST | `/auth/signup` | Register a new user |
| POST | `/auth/login` | Authenticate a user |
| GET | `/` | Health check endpoint |

Example signup request:

```json
{
  "email": "user@example.com",
  "password": "password123",
  "user_type": "CLIENT"
}
```

Example response:

```json
{
  "message": "User created successfully"
}
```

---

# Workflow Lifecycle

Feature Request Lifecycle in FlowState:

```
Client submits Feature Request
        ↓
Manager reviews request
        ↓
Request approved or rejected
        ↓
Approved request converted into Task
        ↓
Task assigned to Developer
        ↓
Task completed and deployed
```

---

# Future Improvements

Planned enhancements for FlowState include:

- Manager approval dashboard
- Developer task board (Kanban-style)
- Notification service integration
- Real-time task updates
- Analytics dashboard for workflow metrics

---

Built with ⚙️ to streamline software development workflows and improve collaboration between clients and development teams.
