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
