# FlowState Use Cases

This document outlines the complete functional requirements for FlowState, mapping interactions between Human Actors and the supporting System Services.

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
