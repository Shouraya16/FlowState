function AdminDashboard(){

  const users = [
    { id: 1, email: "alice@company.com", role: "MANAGER", joined: "2025-02-01" },
    { id: 2, email: "bob@company.com", role: "DEVELOPER", joined: "2025-02-05" },
    { id: 3, email: "carol@company.com", role: "TESTER", joined: "2025-02-10" },
    { id: 4, email: "dave@client.com", role: "CLIENT", joined: "2025-02-15" },
    { id: 5, email: "eve@company.com", role: "DESIGNER", joined: "2025-03-01" },
  ]

  const logs = [
    { id: 1, user: "alice@company.com", action: "APPROVED_REQUEST", time: "09:12" },
    { id: 2, user: "bob@company.com", action: "UPDATED_TASK", time: "10:05" },
    { id: 3, user: "carol@company.com", action: "QA_PASS", time: "11:30" },
    { id: 4, user: "dave@client.com", action: "SUBMITTED_REQUEST", time: "12:00" },
  ]

  return(
    <div className="dashboard">

      {/* HEADER */}
      <div className="dash-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>System overview, user management, and audit logs</p>
        </div>
      </div>

      {/* STATS */}
      <div className="stats">

        <div className="stat-card">
          <h2>{users.length}</h2>
          <p>Total Users</p>
        </div>

        <div className="stat-card">
          <h2>{users.filter(u => u.role === "DEVELOPER").length}</h2>
          <p>Developers</p>
        </div>

        <div className="stat-card">
          <h2>{logs.length}</h2>
          <p>Recent Actions</p>
        </div>

        <div className="stat-card">
          <h2>95%</h2>
          <p>System Uptime</p>
        </div>

      </div>

      {/* USERS TABLE */}
      <div className="table-card">

        <h3>User Management</h3>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.email}</td>

                <td>
                  <span className={`role ${user.role.toLowerCase()}`}>
                    {user.role}
                  </span>
                </td>

                <td>{user.joined}</td>

                <td>
                  <button className="danger-btn">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>

      {/* AUDIT LOGS */}
      <div className="table-card">

        <h3>Audit Logs</h3>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>User</th>
              <th>Action</th>
              <th>Time</th>
            </tr>
          </thead>

          <tbody>
            {logs.map(log => (
              <tr key={log.id}>
                <td>{log.id}</td>
                <td>{log.user}</td>
                <td>{log.action}</td>
                <td>{log.time}</td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>

    </div>
  )
}

export default AdminDashboard