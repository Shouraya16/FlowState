### Q1. Key Classes, Attributes, and Method Definitions

Here are the identified classes with their Visibility Modifiers:
* `+` **Public** (Accessible by everyone)
* `-` **Private** (Accessible only within the class)
* `#` **Protected** (Accessible by subclasses)

#### 1. User Hierarchy (Actors)

**Class: `User` (Abstract Base Class)**
* **Attributes:**
    * `# userId: int`
    * `# fullName: string`
    * `# email: string`
    * `- passwordHash: string`
    * `+ role: RoleEnum`
* **Methods:**
    * `+ login(password: string): bool`
    * `+ logout(): void`
    * `+ updateProfile(data: JSON): void`

**Class: `Client` (Inherits User)**
* **Attributes:**
    * `+ companyName: string`
    * `+ contractId: string`
* **Methods:**
    * `+ submitFeatureRequest(title: string, desc: string): FeatureRequest`
    * `+ viewRequestStatus(reqId: int): RequestStatus`

**Class: `Admin` (Inherits User)**
* **Attributes:**
    * `+ accessLevel: int`
    * `+ adminLogId: int`
* **Methods:**
    * `+ configureSystem(configKey: string, val: string): void`
    * `+ viewAuditLogs(date: Date): List<AuditLog>`
    * `+ manageUser(action: string, targetId: int): void`

**Class: `Employee` (Abstract - Inherits User)**
* **Attributes:**
    * `+ employeeId: string`
    * `+ department: string`
    * `# salary: double`
* **Methods:**
    * `+ viewAssignedTasks(): List<Task>`

**Class: `Manager` (Inherits Employee)**
* **Attributes:**
    * `+ teamSize: int`
* **Methods:**
    * `+ approveRequest(reqId: int): void`
    * `+ rejectRequest(reqId: int): void`
    * `+ manuallyAssignTask(taskId: int, empId: int): void`

**Class: `Developer` (Inherits Employee)**
* **Attributes:**
    * `+ skillSet: List<String>`
    * `+ activeTicketCount: int`
    * `+ isAvailable: bool`
* **Methods:**
    * `+ pushCode(repoUrl: string): void`
    * `+ updateTaskStatus(taskId: int, status: string): void`

**Class: `Tester` (Inherits Employee)**
* **Attributes:**
    * `+ automationTools: List<String>`
    * `+ bugsReportedCount: int`
* **Methods:**
    * `+ executeTestCases(taskId: int): TestResult`
    * `+ logBug(taskId: int, severity: string): void`
    * `+ triggerDeployment(taskId: int): bool`

**Class: `Designer` (Inherits Employee)**
* **Attributes:**
    * `+ portfolioUrl: string`
    * `+ designTools: List<String>`
* **Methods:**
    * `+ uploadAssets(taskId: int, url: string): void`
    * `+ markDesignComplete(taskId: int): void`

#### 2. Business Logic Entities

**Class: `FeatureRequest`**
* **Attributes:**
    * `+ reqId: int`
    * `- clientDetails: JSON`
    * `+ description: string`
    * `+ status: RequestStatus`
    * `+ submissionDate: DateTime`
* **Methods:**
    * `+ validateInput(): bool`
    * `+ convertToTask(): Task`

**Class: `Task`**
* **Attributes:**
    * `+ taskId: int`
    * `+ title: string`
    * `+ priority: PriorityEnum`
    * `+ status: TaskStatus`
    * `+ gitBranch: string`
* **Methods:**
    * `+ updateStatus(newStatus: TaskStatus): void`
    * `+ addComment(msg: string): void`
    * `+ getHistory(): List<AuditLog>`

#### 3. System Architecture

**Class: `WorkflowEngine` (Singleton)**
* **Attributes:**
    * `- instance: WorkflowEngine`
    * `+ activeWorkflows: int`
* **Methods:**
    * `+ getInstance(): WorkflowEngine`
    * `+ triggerSmartAssignment(task: Task): void`
    * `+ processEvent(event: Event): void`

**Class: `AuditLog`**
* **Attributes:**
    * `+ logId: int`
    * `+ timestamp: DateTime`
    * `+ action: string`
    * `+ details: JSON`
* **Methods:**
    * `+ createLog(): void`
    * `+ exportToCSV(): File`

**Class: `BaseAdapter` (Interface)**
* **Methods:**
    * `+ connect(): bool`
    * `+ executeAction(payload: JSON): void`