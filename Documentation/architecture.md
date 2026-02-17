# I. Architecture Style Selection  
*Chosen Architecture:* Layered Architecture

---

# I.A. Justification Based on Granularity

FlowState follows a Layered Architecture where responsibilities are divided into well-defined logical layers within a single deployable application.

---

## 1. Presentation Layer
- Web UI (Login Page, Dashboard, Task Board)
- Forms:
  - Feature Request Submission
  - Task Update
  - Leave Application
- Displays reports and workflow metrics

This layer handles only user interaction and presentation logic.

---

## 2. Application Layer
- Access & Identity Module
- Ingestion & Design Module
- Task Orchestration Coordination
- QA & Deployment Coordination
- HR & Operations Coordination
- Notification Coordination

The Application Layer orchestrates use cases.  
It receives user requests and delegates core rule execution to the Business Logic Layer.

---

## 3. Business Logic Layer
Implements domain rules and system policies:

- Intelligent Task Assignment Logic
- Approval and Rejection Logic
- Task State Transition Logic
- Deployment Trigger Logic
- Role-Based Access Control (RBAC)
- Workflow Engine Automation Rules

Modules such as Task Orchestration contain business rules but are invoked and coordinated through the Application Layer.

This layer contains the core domain logic of the system.

---

## 4. Data Layer
Handles data storage and persistence:

- Users Data
- Feature Requests Data
- Tasks Data
- Audit Logs
- Availability Data

Provides structured relational database access and manages CRUD operations.

---

## 5. External Integration Layer
Handles communication with external systems:

- Authentication Service
- Notification Service
- Deployment Service
- Data Transfer Service

External systems are abstracted using adapters to maintain loose coupling.

---

## Why This Qualifies as Layered Architecture

- Clear vertical separation of concerns  
- Application Layer orchestrates use cases  
- Business Layer encapsulates domain logic  
- Data Layer is isolated from UI  
- Communication flows top to bottom  
- All layers exist within a single deployable unit  

---

## Granularity Justification

- Each module handles a specific domain function.
- Modules are cohesive and follow the single responsibility principle.
- Business rules are centralized in the Business Logic Layer.
- Application Layer coordinates but does not implement core logic.
- External services are abstracted via interfaces.

This demonstrates academically correct layering and proper granularity.

---

# I.B. Why This Architecture is the Best Choice

## 1. Scalability

In a layered architecture, all layers exist within a single deployment unit.

If traffic increases, the entire application is replicated:

Instance 1  
Instance 2  
Instance 3  

The system scales horizontally by duplicating the whole application, not individual modules.

Therefore:
- Task Orchestration does not scale independently.
- QA module does not scale independently.
- The complete application scales together.

This model is appropriate for small to medium-scale systems.

---

## 2. Maintainability

- Clear separation between orchestration (Application Layer) and domain rules (Business Layer).
- UI changes do not affect core logic.
- Centralized business rules improve readability and modification.
- Modular structure simplifies debugging.

---

## 3. Performance

- No network overhead between internal modules.
- Direct in-process communication between layers.
- Faster than distributed microservices architecture.

---

## 4. Simplicity

- Single deployable application.
- No distributed infrastructure required.
- Easier testing and debugging.
- Suitable for academic-scale systems.

---

## 5. Extensibility

- New modules (e.g., Analytics) can be added within the same layered structure.
- Workflow rules can be extended in the Business Layer.
- External APIs can be integrated using adapters without modifying core logic.

---

## Why Not Microservices Architecture?

- System scope does not justify distributed complexity.
- Requires containerization and orchestration infrastructure.
- Introduces inter-service communication overhead.
- Increases deployment and maintenance complexity.
- Not suitable for academic-sized workflow automation systems.

Therefore, Layered Architecture is the most appropriate architectural style for FlowState.