import { useEffect, useState } from "react"
import { apiFetch } from "../utils/apiFetch"

const ACTION_COLORS = {
  USER_SIGNUP:            { bg: "#dcfce7", color: "#166534" },
  USER_LOGIN:             { bg: "#dbeafe", color: "#1e40af" },
  REQUEST_SUBMITTED:      { bg: "#f3e8ff", color: "#6b21a8" },
  REQUEST_APPROVED:       { bg: "#dcfce7", color: "#166534" },
  REQUEST_REJECTED:       { bg: "#fee2e2", color: "#991b1b" },
  TASK_CREATED:           { bg: "#fef9c3", color: "#854d0e" },
  TASK_ASSIGNED:          { bg: "#fce7f3", color: "#9d174d" },
  TASK_STARTED:           { bg: "#dbeafe", color: "#1e40af" },
  DESIGN_COMPLETE:        { bg: "#f3e8ff", color: "#6b21a8" },
  GIT_LINK_SAVED:         { bg: "#f1f5f9", color: "#475569" },
  TASK_SUBMITTED_FOR_QA:  { bg: "#fef9c3", color: "#854d0e" },
  QA_PASSED:              { bg: "#dcfce7", color: "#166534" },
  QA_FAILED:              { bg: "#fee2e2", color: "#991b1b" },
  ASSET_UPLOADED:         { bg: "#fce7f3", color: "#9d174d" },
  USER_DELETED:           { bg: "#fee2e2", color: "#991b1b" },
  TASK_STATUS_UPDATED:    { bg: "#f1f5f9", color: "#475569" },
}

const getRoleStyle = (role) => {
  const map = {
    MANAGER:   { background: "#e0e7ff", color: "#3730a3" },
    DEVELOPER: { background: "#dbeafe", color: "#1e40af" },
    TESTER:    { background: "#fef3c7", color: "#92400e" },
    CLIENT:    { background: "#dcfce7", color: "#166534" },
    DESIGNER:  { background: "#fce7f3", color: "#9d174d" },
    ADMIN:     { background: "#f3e8ff", color: "#6b21a8" },
    EMPLOYEE:  { background: "#f1f5f9", color: "#475569" },
  }
  return map[role] || { background: "#f3f4f6", color: "#374151" }
}

function formatDetails(details) {
  if (!details || Object.keys(details).length === 0) return "—"
  return Object.entries(details)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
    .join(" · ")
}

function AdminDashboard() {

  const [users, setUsers]     = useState([])
  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("users")
  const [logFilter, setLogFilter] = useState("ALL")

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    try {
      const [uRes, lRes] = await Promise.all([
        apiFetch("/admin/users"),
        apiFetch("/admin/audit-logs")
      ])
      const uData = await uRes.json()
      const lData = await lRes.json()
      setUsers(Array.isArray(uData) ? uData : [])
      setLogs(Array.isArray(lData) ? lData : [])
    } catch (err) {
      console.error("Admin load error:", err)
    } finally {
      setLoading(false)
    }
  }

  const removeUser = async (id, email) => {
    if (!window.confirm(`Remove user ${email}?`)) return
    const res = await apiFetch(`/admin/users/${id}`, { method: "DELETE" })
    if (res.ok) {
      setUsers(prev => prev.filter(u => u.id !== id))
      // Refresh logs to show the USER_DELETED entry
      apiFetch("/admin/audit-logs")
        .then(r => r.json())
        .then(d => setLogs(Array.isArray(d) ? d : []))
    } else {
      alert("Failed to remove user")
    }
  }

  // Unique action types for filter dropdown
  const actionTypes = ["ALL", ...new Set(logs.map(l => l.action_type))]
  const filteredLogs = logFilter === "ALL"
    ? logs
    : logs.filter(l => l.action_type === logFilter)

  const tabBtn = (label, tab) => (
    <button
      onClick={() => setActiveTab(tab)}
      style={{
        padding: "10px 20px", borderRadius: "8px", cursor: "pointer",
        fontWeight: "500", fontSize: "14px",
        background: activeTab === tab ? "#5b5bf7" : "white",
        color: activeTab === tab ? "white" : "#374151",
        border: activeTab === tab ? "none" : "1px solid #e5e7eb",
      }}
    >
      {label}
    </button>
  )

  return (
    <div className="dashboard">

      <div className="dash-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p style={{ color: "#6b7280", marginTop: "4px" }}>
            System overview, user management, and full audit trail
          </p>
        </div>
        <button
          onClick={loadAll}
          style={{
            padding: "10px 18px", background: "#f1f5f9", border: "1px solid #e5e7eb",
            borderRadius: "8px", cursor: "pointer", fontSize: "13px", color: "#374151"
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* STATS */}
      <div className="stats">
        <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => setActiveTab("users")}>
          <h2 style={{ color: "#5b5bf7" }}>{users.length}</h2>
          <p>Total Users</p>
        </div>
        <div className="stat-card">
          <h2 style={{ color: "#1e40af" }}>
            {users.filter(u => u.role === "DEVELOPER").length}
          </h2>
          <p>Developers</p>
        </div>
        <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => setActiveTab("logs")}>
          <h2 style={{ color: "#6b21a8" }}>{logs.length}</h2>
          <p>Audit Entries</p>
        </div>
        <div className="stat-card">
          <h2 style={{ color: "#166534" }}>
            {logs.filter(l => l.action_type === "USER_LOGIN").length}
          </h2>
          <p>Total Logins</p>
        </div>
        <div className="stat-card">
          <h2 style={{ color: "#854d0e" }}>
            {logs.filter(l => l.action_type === "QA_PASSED").length}
          </h2>
          <p>QA Passed</p>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        {tabBtn("User Management", "users")}
        {tabBtn(`Audit Logs (${logs.length})`, "logs")}
      </div>

      {/* ── USERS TAB ── */}
      {activeTab === "users" && (
        <div className="table-card">
          <h3>All Users</h3>
          {loading ? (
            <p style={{ color: "#6b7280", padding: "20px 0" }}>Loading...</p>
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
                    <td style={{ color: "#9ca3af", fontSize: "13px" }}>{user.id}</td>
                    <td style={{ fontWeight: "500" }}>{user.email}</td>
                    <td>
                      <span className="status" style={getRoleStyle(user.role)}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ color: "#6b7280", fontSize: "13px" }}>
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric"
                          })
                        : "—"}
                    </td>
                    <td>
                      <button
                        className="danger-btn"
                        onClick={() => removeUser(user.id, user.email)}
                      >
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

      {/* ── AUDIT LOGS TAB ── */}
      {activeTab === "logs" && (
        <div className="table-card">

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0 }}>Audit Logs</h3>

            {/* Filter by action type */}
            <select
              value={logFilter}
              onChange={e => setLogFilter(e.target.value)}
              style={{
                padding: "8px 14px", borderRadius: "8px",
                border: "1px solid #e5e7eb", fontSize: "13px",
                background: "white", color: "#374151", cursor: "pointer"
              }}
            >
              {actionTypes.map(t => (
                <option key={t} value={t}>
                  {t === "ALL" ? "All Actions" : t.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <p style={{ color: "#6b7280", padding: "20px 0" }}>Loading logs...</p>
          ) : filteredLogs.length === 0 ? (
            <p style={{ color: "#6b7280", padding: "20px 0" }}>
              No audit logs yet. Logs appear here as users perform actions.
            </p>
          ) : (
            <table>
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
                {filteredLogs.map(log => (
                  <tr key={log.id}>
                    <td style={{ color: "#9ca3af", fontSize: "12px" }}>{log.id}</td>

                    <td style={{ fontSize: "13px" }}>
                      <div style={{ fontWeight: "500", color: "#1f2937" }}>
                        {log.user_email || "System"}
                      </div>
                      {log.user_id && (
                        <div style={{ color: "#9ca3af", fontSize: "11px" }}>
                          ID #{log.user_id}
                        </div>
                      )}
                    </td>

                    <td>
                      <span
                        className="status"
                        style={ACTION_COLORS[log.action_type] || { background: "#f3f4f6", color: "#374151" }}
                      >
                        {log.action_type.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td style={{ fontSize: "12px", color: "#6b7280", maxWidth: "280px" }}>
                      {formatDetails(log.details)}
                    </td>

                    <td style={{ fontSize: "12px", color: "#6b7280", whiteSpace: "nowrap" }}>
                      {log.timestamp
                        ? new Date(log.timestamp).toLocaleString("en-IN", {
                            day: "numeric", month: "short",
                            hour: "2-digit", minute: "2-digit"
                          })
                        : "—"}
                    </td>
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