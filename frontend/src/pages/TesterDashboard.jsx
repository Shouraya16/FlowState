// TesterDashboard.jsx
// Shows tasks ready for QA, pass/fail actions, and bug count

const mockQATasks = [
  { id: 201, title: "Test Auth Module", developer: "John", priority: "HIGH", status: "READY_FOR_QA" },
  { id: 202, title: "Test Feature Request API", developer: "John", priority: "MEDIUM", status: "READY_FOR_QA" },
  { id: 203, title: "Test Login Flow", developer: "Sara", priority: "HIGH", status: "PASSED" },
  { id: 204, title: "Test Dashboard UI", developer: "Sara", priority: "LOW", status: "FAILED" },
];

const statusColors = {
  READY_FOR_QA: { bg: "#dbeafe", color: "#1e40af" },
  PASSED: { bg: "#dcfce7", color: "#166534" },
  FAILED: { bg: "#fee2e2", color: "#991b1b" },
};

const priorityColors = {
  HIGH: { bg: "#fee2e2", color: "#991b1b" },
  MEDIUM: { bg: "#fef9c3", color: "#854d0e" },
  LOW: { bg: "#dcfce7", color: "#166534" },
};

function TesterDashboard() {
  return (
    <div className="dash-wrapper">
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Tester Dashboard</h1>
          <p className="dash-subtitle">Validate tasks and manage QA pipeline</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-number">
            {mockQATasks.filter((t) => t.status === "READY_FOR_QA").length}
          </span>
          <span className="stat-label">Ready for QA</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">
            {mockQATasks.filter((t) => t.status === "PASSED").length}
          </span>
          <span className="stat-label">Passed</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">
            {mockQATasks.filter((t) => t.status === "FAILED").length}
          </span>
          <span className="stat-label">Failed</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{mockQATasks.length}</span>
          <span className="stat-label">Total</span>
        </div>
      </div>

      {/* QA Tasks Table */}
      <div className="dash-card">
        <h3 className="card-title">🧪 QA Tasks</h3>
        <table className="dash-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Task</th>
              <th>Developer</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockQATasks.map((task) => (
              <tr key={task.id}>
                <td>{task.id}</td>
                <td>{task.title}</td>
                <td>{task.developer}</td>
                <td>
                  <span className="status-badge" style={priorityColors[task.priority]}>
                    {task.priority}
                  </span>
                </td>
                <td>
                  <span className="status-badge" style={statusColors[task.status]}>
                    {task.status.replace(/_/g, " ")}
                  </span>
                </td>
                <td>
                  {task.status === "READY_FOR_QA" && (
                    <>
                      <button className="action-btn approve-btn">Pass ✓</button>
                      <button className="action-btn reject-btn">Fail ✗</button>
                    </>
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

export default TesterDashboard;
