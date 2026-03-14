// AdminDashboard.jsx
// Shows system overview, user list, and audit logs

const mockUsers = [
  { id: 1, email: "alice@company.com", role: "MANAGER", created: "2025-02-01" },
  { id: 2, email: "bob@company.com", role: "DEVELOPER", created: "2025-02-05" },
  { id: 3, email: "carol@company.com", role: "TESTER", created: "2025-02-10" },
  { id: 4, email: "dave@client.com", role: "CLIENT", created: "2025-02-15" },
  { id: 5, email: "eve@company.com", role: "DESIGNER", created: "2025-03-01" },
];

const mockAuditLogs = [
  { id: 1, user: "alice@company.com", action: "APPROVED_REQUEST", details: "Request #3 approved", time: "2025-03-10 09:12" },
  { id: 2, user: "bob@company.com", action: "UPDATED_TASK", details: "Task #101 → IN_PROGRESS", time: "2025-03-10 10:05" },
  { id: 3, user: "carol@company.com", action: "MARKED_PASSED", details: "Task #103 passed QA", time: "2025-03-10 11:30" },
  { id: 4, user: "dave@client.com", action: "SUBMITTED_REQUEST", details: "New request: Dark Mode", time: "2025-03-10 12:00" },
];

const roleColors = {
  MANAGER: { bg: "#f3e8ff", color: "#6b21a8" },
  DEVELOPER: { bg: "#dbeafe", color: "#1e40af" },
  TESTER: { bg: "#fef9c3", color: "#854d0e" },
  CLIENT: { bg: "#dcfce7", color: "#166534" },
  DESIGNER: { bg: "#fce7f3", color: "#9d174d" },
  ADMIN: { bg: "#fee2e2", color: "#991b1b" },
};

function AdminDashboard() {
  return (
    <div className="dash-wrapper">
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Admin Dashboard</h1>
          <p className="dash-subtitle">System overview, user management, and audit logs</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-number">{mockUsers.length}</span>
          <span className="stat-label">Total Users</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">
            {mockUsers.filter((u) => u.role === "DEVELOPER").length}
          </span>
          <span className="stat-label">Developers</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{mockAuditLogs.length}</span>
          <span className="stat-label">Recent Actions</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">95%</span>
          <span className="stat-label">System Uptime</span>
        </div>
      </div>

      {/* User Management */}
      <div className="dash-card">
        <h3 className="card-title">👤 User Management</h3>
        <table className="dash-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.email}</td>
                <td>
                  <span className="status-badge" style={roleColors[user.role]}>
                    {user.role}
                  </span>
                </td>
                <td>{user.created}</td>
                <td>
                  <button className="action-btn reject-btn">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Audit Logs */}
      <div className="dash-card">
        <h3 className="card-title">📋 Audit Logs</h3>
        <table className="dash-table">
          <thead>
            <tr>
              <th>#</th>
              <th>User</th>
              <th>Action</th>
              <th>Details</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {mockAuditLogs.map((log) => (
              <tr key={log.id}>
                <td>{log.id}</td>
                <td>{log.user}</td>
                <td>
                  <code className="branch-tag">{log.action}</code>
                </td>
                <td>{log.details}</td>
                <td>{log.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminDashboard;
