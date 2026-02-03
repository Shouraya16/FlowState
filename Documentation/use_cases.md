# FlowState Use Cases

This document outlines the complete functional requirements for FlowState, mapping interactions between Human Actors and the supporting System Services.

## Actors List

### Human Actors
* Client: Initiates requests.
* Manager: Approves requests, oversees workflow, and manages team.
* Designer: Creates UI/UX assets.
* Developer: Implements feature code.
* Tester: Validates functionality.
* Admin: Manages system configuration and users.

### System Actors (Services)
* *Authentication Service:* Handles identity, login, and access provisioning.
* *Notification Service:* Handles emails, Slack messages, and real-time alerts.
* *Deployment Service:* Manages CI/CD pipelines and production releases.
* *Data Transfer Service:* Syncs data between external tools (GitHub, Jira, Calendar) and internal DB.

---

## 1. Access & Identity Module
Centralized security managed by the Auth Service.

### UC-01: User Registration & Secure Login
* *Primary Actor:* All Human Actors
* *Secondary Actor:* Authentication Service
* *Description:* Users access the platform securely.
* *Flow:*
    1.  User submits credentials.
    2.  *Authentication Service* validates hash and issues a session token.
    3.  *Authentication Service* returns the user's Role to the frontend.

### UC-02: Role-Based Access Control (RBAC)
* *Primary Actor:* Admin
* *Secondary Actor:* Authentication Service
* *Description:* Restrict access to features based on role.
* *Flow:*
    1.  Admin defines permissions (e.g., "Client can only view Request module").
    2.  *Authentication Service* enforces these rules on every API call.

### UC-03: Automated Onboarding & Provisioning
* *Primary Actor:* Manager
* *Secondary Actor:* Authentication Service, Data Transfer Service
* *Description:* Manager adds a new hire; system auto-provisions tools.
* *Flow:*
    1.  Manager adds new user (e.g., "John", Role: "Developer").
    2.  *Authentication Service* creates FlowState account.
    3.  *Data Transfer Service* API calls external tools to:
        * Add user to GitHub Organization.
        * Invite user to Slack Workspace.
        * Grant access to Jira Project.

---

## 2. Ingestion & Design Module
Handling requests and preparing visual assets.

### UC-04: Submit Feature Request
* *Primary Actor:* Client
* *Secondary Actor:* Notification Service
* *Description:* Client requests a new feature.
* *Flow:*
    1.  Client submits request form.
    2.  System records request as PENDING_APPROVAL.
    3.  *Notification Service* alerts the Manager via Slack/Email.

### UC-05: Review Request (Approve/Reject)
* *Primary Actor:* Manager
* *Secondary Actor:* Notification Service
* *Description:* Manager reviews request viability.
* *Flow:*
    1.  Manager reviews request.
    2.  *If Rejected:* *Notification Service* emails Client.
    3.  *If Approved:* Manager assigns to *Designer. **Notification Service* alerts Designer.

### UC-06: Submit Design Assets
* *Primary Actor:* Designer
* *Secondary Actor:* Data Transfer Service
* *Description:* Designer uploads mockups (Figma links, assets).
* *Flow:*
    1.  Designer completes work and attaches files.
    2.  *Data Transfer Service* syncs assets to storage.
    3.  Task status moves to READY_FOR_DEV.

---
## 3. Intelligent Development Module
The core build phase with smart assignment.

### UC-07: Intelligent Task Assignment (Smart Load Balancing)
* Primary Actor: System (Auto-Assign) or Manager
* Secondary Actor: Data Transfer Service, Notification Service
* Description: Assign task to the best available Developer.
* Flow:
    1.  Data Transfer Service fetches "Workload Scores" (ticket count) for all Developers.
    2.  System filters out Developers currently on Leave (see UC-12).
    3.  System assigns task to the Dev with the lowest load.
    4.  Notification Service alerts Developer: "New Task Assigned."

### UC-08: Code Implementation & Sync
* Primary Actor: Developer
* Secondary Actor: Data Transfer Service
* Description: Developer writes code; system syncs progress.
* Flow:
    1.  Developer links GitHub Pull Request to the task.
    2.  Data Transfer Service pulls PR metadata (commits, status) to FlowState dashboard.
    3.  Developer moves task to READY_FOR_QA.

---

## 4. Quality Assurance & Deployment Module
Testing and releasing to production.

### UC-09: Execute Testing (Pass/Fail)
* Primary Actor: Tester
* Secondary Actor: Notification Service
* Description: Tester validates code.
* Flow:
    1.  Tester runs test cases.
    2.  If Fail: Tester marks "Failed". Notification Service alerts Developer immediately. Status reverts to IN_PROGRESS.
    3.  If Pass: Tester marks "Passed". Task moves to READY_TO_DEPLOY.

### UC-10: Automated Deployment
* Primary Actor: Tester (Trigger)
* Secondary Actor: Deployment Service, Notification Service
* Description: Validated code is pushed to production.
* Flow:
    1.  Tester/Manager clicks "Deploy".
    2.  Deployment Service triggers CI/CD pipeline (e.g., GitHub Actions).
    3.  Deployment Service returns success/failure status.
    4.  Notification Service emails Client: "Your feature is live!"

---

## 5. HR & Operations Automations (Tentative)
Internal process management.

### UC-11: Apply for Leave
* *Primary Actor:* Developer / Tester / Designer
* *Secondary Actor:* Notification Service
* *Description:* Employee submits leave request.
* *Flow:*
    1.  User selects dates.
    2.  *Notification Service* alerts Manager for approval.
    3.  Once approved, system updates "Availability DB" (which affects UC-07).

### UC-12: Meeting Updates & Action Items
* *Primary Actor:* All Users
* *Secondary Actor:* Data Transfer Service
* *Description:* Capture outcomes after a scheduled meeting.
* *Flow:*
    1.  *Data Transfer Service* detects Google Calendar event end.
    2.  System prompts attendees to log "Action Items."
    3.  Logged items are converted into new Tasks automatically.

---

## 6. Administration & Monitoring (Tentative)
System health and configuration.

### UC-13: System Configuration
* *Primary Actor:* Admin
* *Secondary Actor:* Data Transfer Service
* *Description:* Configure integrations (Jira, Slack, GitHub keys).
* *Flow:*
    1.  Admin inputs API Keys.
    2.  *Data Transfer Service* validates connectivity.

### UC-14: View Dashboard & Metrics
* *Primary Actor:* Manager / Admin
* *Description:* View real-time project health.
* *Flow:*
    1.  System aggregates data: "Avg Resolution Time," "Active Bugs," "Team Availability."
    2.  Displays charts and graphs.

### UC-15: View Audit Logs
* *Primary Actor:* Admin
* *Description:* Compliance logging.
* *Flow:*
    1.  Admin views "Activity Log".
    2.  System displays immutable history of every action taken by any actor.