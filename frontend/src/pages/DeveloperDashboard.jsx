// DeveloperDashboard.jsx
// Shows developer's assigned tasks, their statuses, and ability to update

const mockTasks = [
  { id: 101, title: "Implement Auth Module", priority: "HIGH", status: "IN_PROGRESS", branch: "feature/auth-module" },
  { id: 102, title: "Fix Login Bug", priority: "HIGH", status: "DONE", branch: "fix/login-bug" },
  { id: 103, title: "Build API for Feature Requests", priority: "MEDIUM", status: "TODO", branch: "feature/request-api" },
  { id: 104, title: "Refactor Database Layer", priority: "LOW", status: "TODO", branch: "refactor/db-layer" },
];

const statusColors = {
  TODO: { bg: "#f3f4f6", color: "#374151" },
  IN_PROGRESS: { bg: "#dbeafe", color: "#1e40af" },
  DONE: { bg: "#dcfce7", color: "#166534" },
};

const priorityColors = {
  HIGH: { bg: "#fee2e2", color: "#991b1b" },
  MEDIUM: { bg: "#fef9c3", color: "#854d0e" },
  LOW: { bg: "#dcfce7", color: "#166534" },
};

function DeveloperDashboard() {
  return (
    <div className="dash-wrapper">
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Developer Dashboard</h1>
          <p className="dash-subtitle">Your assigned tasks and development progress</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-number">{mockTasks.length}</span>
          <span className="stat-label">Total Tasks</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">
            {mockTasks.filter((t) => t.status === "TODO").length}
          </span>
          <span className="stat-label">To Do</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">
            {mockTasks.filter((t) => t.status === "IN_PROGRESS").length}
          </span>
          <span className="stat-label">In Progress</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">
            {mockTasks.filter((t) => t.status === "DONE").length}
          </span>
          <span className="stat-label">Done</span>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="dash-card">
        <h3 className="card-title">🛠️ My Tasks</h3>
        <table className="dash-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Task</th>
              <th>Branch</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {mockTasks.map((task) => (
              <tr key={task.id}>
                <td>{task.id}</td>
                <td>{task.title}</td>
                <td>
                  <code className="branch-tag">{task.branch}</code>
                </td>
                <td>
                  <span className="status-badge" style={priorityColors[task.priority]}>
                    {task.priority}
                  </span>
                </td>
                <td>
                  <span className="status-badge" style={statusColors[task.status]}>
                    {task.status.replace("_", " ")}
                  </span>
                </td>
                <td>
                  {task.status !== "DONE" && (
                    <button className="action-btn approve-btn">
                      Mark Done
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DeveloperDashboard;
