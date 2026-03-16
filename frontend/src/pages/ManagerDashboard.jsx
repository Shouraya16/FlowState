// ManagerDashboard.jsx
// Shows pending approvals, team task overview, and key metrics

const mockPendingRequests = [
  { id: 1, title: "Add Dark Mode", client: "Acme Corp", date: "2025-03-05" },
  { id: 2, title: "Mobile App Support", client: "TechStart", date: "2025-03-07" },
  { id: 3, title: "Export to PDF", client: "Globex Inc", date: "2025-03-09" },
];

const mockTeamTasks = [
  { id: 101, title: "Implement Auth Module", assignee: "John (Dev)", status: "IN_PROGRESS" },
  { id: 102, title: "Design Landing Page", assignee: "Sara (Designer)", status: "IN_PROGRESS" },
  { id: 103, title: "Write API Tests", assignee: "Mike (Tester)", status: "TODO" },
  { id: 104, title: "Fix Login Bug", assignee: "John (Dev)", status: "DONE" },
];

const statusColors = {
  TODO: { bg: "#f3f4f6", color: "#374151" },
  IN_PROGRESS: { bg: "#dbeafe", color: "#1e40af" },
  DONE: { bg: "#dcfce7", color: "#166534" },
};

function ManagerDashboard() {
  return (
    <div className="dash-wrapper">
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Manager Dashboard</h1>
          <p className="dash-subtitle">Oversee approvals, team tasks, and project health</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-number">{mockPendingRequests.length}</span>
          <span className="stat-label">Pending Approvals</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{mockTeamTasks.length}</span>
          <span className="stat-label">Total Tasks</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">
            {mockTeamTasks.filter((t) => t.status === "IN_PROGRESS").length}
          </span>
          <span className="stat-label">In Progress</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">
            {mockTeamTasks.filter((t) => t.status === "DONE").length}
          </span>
          <span className="stat-label">Completed</span>
        </div>
      </div>

      {/* Pending Approvals */}
      <div className="dash-card">
        <h3 className="card-title">⏳ Pending Approvals</h3>
        <table className="dash-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Feature Request</th>
              <th>Client</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockPendingRequests.map((req) => (
              <tr key={req.id}>
                <td>{req.id}</td>
                <td>{req.title}</td>
                <td>{req.client}</td>
                <td>{req.date}</td>
                <td>
                  <button className="action-btn approve-btn">Approve</button>
                  <button className="action-btn reject-btn">Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Team Task Overview */}
      <div className="dash-card">
        <h3 className="card-title">👥 Team Task Overview</h3>
        <table className="dash-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Task</th>
              <th>Assigned To</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {mockTeamTasks.map((task) => (
              <tr key={task.id}>
                <td>{task.id}</td>
                <td>{task.title}</td>
                <td>{task.assignee}</td>
                <td>
                  <span className="status-badge" style={statusColors[task.status]}>
                    {task.status.replace("_", " ")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ManagerDashboard;
