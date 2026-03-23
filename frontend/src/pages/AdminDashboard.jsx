import { useEffect, useState } from "react"
import { apiFetch } from "../utils/apiFetch"

function AdminDashboard() {

  const [users, setUsers] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("users")

  useEffect(() => {
    apiFetch("/admin/users")
      .then(res => res.json())
      .then(data => {
        setUsers(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))

    apiFetch("/admin/audit-logs")
      .then(res => res.json())
      .then(data => setLogs(Array.isArray(data) ? data : []))
      .catch(err => console.error("Logs error:", err))
  }, [])

  const removeUser = async (id) => {
    if (!window.confirm("Remove this user?")) return
    const res = await apiFetch(`/admin/users/${id}`, { method: "DELETE" })
    if (res.ok) {
      setUsers(prev => prev.filter(u => u.id !== id))
    } else {
      alert("Failed to remove user")
    }
  }

  const getRoleStyle = (role) => {
    const map = {
      MANAGER: { background: "#e0e7ff", color: "#3730a3" },
      DEVELOPER: { background: "#dbeafe", color: "#1e40af" },
      TESTER: { background: "#fef3c7", color: "#92400e" },
      CLIENT: { background: "#dcfce7", color: "#166534" },
      DESIGNER: { background: "#fce7f3", color: "#9d174d" },
      ADMIN: { background: "#f3e8ff", color: "#6b21a8" },
    }
    return map[role] || { background: "#f3f4f6", color: "#374151" }
  }

  return (
    <div className="dashboard">

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
          <h2>{users.filter(u => u.role === "DEVELOPER" || u.employee_type === "DEVELOPER").length}</h2>
          <p>Developers</p>
        </div>
        <div className="stat-card">
          <h2>{logs.length}</h2>
          <p>Audit Entries</p>
        </div>
        <div className="stat-card">
          <h2>95%</h2>
          <p>System Uptime</p>
        </div>
      </div>

      {/* TAB SWITCHER */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
        <button
          className={activeTab === "users" ? "primary-btn" : ""}
          onClick={() => setActiveTab("users")}
          style={activeTab !== "users" ? { padding: "10px 18px", borderRadius: "8px", border: "1px solid #ddd", background: "white", cursor: "pointer" } : {}}
        >
          User Management
        </button>
        <button
          className={activeTab === "logs" ? "primary-btn" : ""}
          onClick={() => setActiveTab("logs")}
          style={activeTab !== "logs" ? { padding: "10px 18px", borderRadius: "8px", border: "1px solid #ddd", background: "white", cursor: "pointer" } : {}}
        >
          Audit Logs
        </button>
      </div>

      {/* USERS TABLE */}
      {activeTab === "users" && (
        <div className="table-card">
          <h3>User Management</h3>
          {loading ? (
            <p style={{ color: "#6b7280", padding: "20px 0" }}>Loading users...</p>
          ) : users.length === 0 ? (
            <p style={{ color: "#6b7280", padding: "20px 0" }}>No users found.</p>
          ) : (
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
                      <span className="status" style={getRoleStyle(user.role || user.employee_type)}>
                        {user.role || user.employee_type}
                      </span>
                    </td>
                    <td>{user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}</td>
                    <td>
                      <button className="danger-btn" onClick={() => removeUser(user.id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* AUDIT LOGS */}
      {activeTab === "logs" && (
        <div className="table-card">
          <h3>Audit Logs</h3>
          {logs.length === 0 ? (
            <p style={{ color: "#6b7280", padding: "20px 0" }}>No audit logs yet.</p>
          ) : (
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
                    <td>{log.user_email || log.user_id}</td>
                    <td>{log.action_type}</td>
                    <td>{log.timestamp ? new Date(log.timestamp).toLocaleString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

    </div>
  )
}

export default AdminDashboard