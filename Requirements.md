# End-to-End Software Development Workflow Automation Platform  
## Software Requirements Specification (SRS)

---

## 1. Introduction

### 1.1 Purpose

This document describes the requirements for the *End-to-End Software Development Workflow Automation Platform*.  
The system aims to automate the complete Software Development Life Cycle (SDLC) workflow including feature request submission, task assignment, development tracking, testing, deployment, and notifications.

This SRS is intended for:
- Developers  
- Project Evaluators  
- System Designers  

---

### 1.2 Scope

The system provides an integrated platform that automates software project workflows. It reduces manual coordination and improves efficiency by ensuring tasks move automatically between stages such as development, testing, and deployment.

The system will:
- Accept feature requests  
- Assign tasks automatically  
- Track development progress  
- Simulate testing and deployment  
- Provide dashboards and reports  

---

### 1.3 Definitions

| Term | Meaning |
|----|----|
| Workflow Engine | Logic that moves tasks between stages |
| Task | Work item assigned to a developer |
| SDLC | Software Development Life Cycle |
| Deployment | Final release stage |
| Automation | System-driven task transitions |

---

### 1.4 References
- IEEE SRS Documentation Standards  
- Agile SDLC Models  

---

## 2. Overall Description

### 2.1 Product Perspective

This is a standalone web application that integrates workflow automation for software development teams.  
It acts as a simplified combination of a project management tool and a workflow automation engine.

---

### 2.2 Product Functions

The system will:
- Manage user roles  
- Allow feature request submission  
- Assign tasks based on predefined rules  
- Track workflow stages  
- Notify users of task updates  
- Generate analytical reports  

---

### 2.3 User Classes

| User Type | Description |
|---------|------------|
| Client | Submits feature requests |
| Manager | Approves and assigns tasks |
| Developer | Works on assigned tasks |
| Tester | Tests completed tasks |
| Admin | Manages system settings |

---

### 2.4 Operating Environment
- Web Browser  
- Backend Server (Python Flask / FastAPI)  
- MySQL / PostgreSQL Database  

---

### 2.5 Design Constraints
- Must run on standard web browsers  
- Database must support relational structure  
- Authentication must be secure  

---

### 2.6 Assumptions & Dependencies
- Users have internet access  
- System is used for simulated SDLC workflows only  
- No real production deployment is performed  

---

## 3. Functional Requirements

| ID | Requirement |
|----|------------|
| FR1 | System shall allow user registration and login |
| FR2 | System shall support role-based access control |
| FR3 | Clients shall submit feature requests |
| FR4 | Managers shall approve or reject requests |
| FR5 | System shall assign tasks automatically |
| FR6 | Developers shall update task status |
| FR7 | System shall move tasks to testing stage |
| FR8 | Testers shall mark tasks as pass or fail |
| FR9 | System shall move passed tasks to deployment |
| FR10 | System shall notify users at each stage |
| FR11 | Dashboard shall show task statistics |
| FR12 | System shall log complete workflow history |

---
