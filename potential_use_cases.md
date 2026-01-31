# DRAFT 1
## Actors
- Client
- Manager
- Admin
- Developr
- Designer
- Tester
- Notification Service
- Authentication Service
- Deployment Service
- Data Transfer Service

## Use Cases
- Client requests to add a feature request
- Manager accepts or rejects the request
- In case of accept, the request is sent to the developer and client is notified
- In case of reject, the client is notified
- Developer recieves the requirement based on the amount of work they have and other considerations
- Developer updates the task status
- Developer submits the final code
- Code sent to tester
- Tester Tests code and mark as pass or fail
- if fail, the task is sent back to the dev
- if pass, the task is forwarded for deployment
- allow testers to update the status

