import { useEffect, useState } from "react"
import { apiFetch } from "../utils/apiFetch"

function ManagerDashboard() {

  const [requests, setRequests] = useState([])
  const [tasks, setTasks] = useState([])
  const [filter, setFilter] = useState("PENDING")
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("requests")

  useEffect(() => {
    // Fetch feature requests
    apiFetch("/requests")
      .then(res => res.json())
      .then(data => {
        setRequests(data)
        setLoading(false)
      })
      .catch(err => {
        console.error("Failed to fetch requests:", err)
        setLoading(false)
      })

    // Fetch all tasks
    apiFetch("/tasks")
      .then(res => res.json())
      .then(data => setTasks(data))
      .catch(err => console.error("Failed to fetch tasks:", err))
  }, [])

  const pending = requests.filter(r => r.status === "PENDING")
  const displayed = filter === "ALL" ? requests : requests.filter(r => r.status === "PENDING")

  const updateStatus = async (id, status) => {
    const res = await apiFetch(`/requests/${id}/status?status=${status}`, {
      method: "PATCH"
    })

    if (res.ok) {
      setRequests(prev =>
        prev.map(r => r.id === id ? { ...r, status } : r)
      )
    } else {
      alert("Failed to update status")
    }
  }

  return (
    <div className="dashboard">

      <div className="dash-header">
        <div>
          <h1>Manager Dashboard</h1>
          <p>Review requests and oversee team tasks</p>
        </div>
      </div>

      {/* STATS */}
      <div className="stats">
        <div
          className={`stat-card ${filter === "PENDING" ? "active" : ""}`}
          onClick={() => { setFilter("PENDING"); setActiveTab("requests") }}
          style={{ cursor: "pointer" }}
        >
          <h2>{pending.length}</h2>
          <p>Pending Approvals</p>
        </div>
        <div
          className={`stat-card ${filter === "ALL" ? "active" : ""}`}
          onClick={() => { setFilter("ALL"); setActiveTab("requests") }}
          style={{ cursor: "pointer" }}
        >
          <h2>{requests.length}</h2>
          <p>Total Requests</p>
        </div>
        <div
          className="stat-card"
          onClick={() => setActiveTab("tasks")}
          style={{ cursor: "pointer" }}
        >
          <h2>{tasks.length}</h2>
          <p>Active Tasks</p>
        </div>
      </div>

      {/* TAB SWITCHER */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
        <button
          className={activeTab === "requests" ? "primary-btn" : ""}
          onClick={() => setActiveTab("requests")}
          style={activeTab !== "requests" ? { padding: "10px 18px", borderRadius: "8px", border: "1px solid #ddd", background: "white", cursor: "pointer" } : {}}
        >
          Feature Requests
        </button>
        <button
          className={activeTab === "tasks" ? "primary-btn" : ""}
          onClick={() => setActiveTab("tasks")}
          style={activeTab !== "tasks" ? { padding: "10px 18px", borderRadius: "8px", border: "1px solid #ddd", background: "white", cursor: "pointer" } : {}}
        >
          All Tasks
        </button>
      </div>

      {/* REQUESTS TABLE */}
      {activeTab === "requests" && (
        <div className="table-card">
          <h3>{filter === "ALL" ? "All Requests" : "Pending Requests"}</h3>

          {loading ? (
            <p style={{ color: "#6b7280", padding: "20px 0" }}>Loading...</p>
          ) : displayed.length === 0 ? (
            <p style={{ color: "#6b7280", padding: "20px 0" }}>No requests found.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map(r => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.title}</td>
                    <td>{r.description}</td>
                    <td>
                      <span className={`status ${r.status.toLowerCase().replace("_", "")}`}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      {r.status === "PENDING" && (
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => updateStatus(r.id, "APPROVED")}
                            style={{ padding: "6px 14px", background: "#16a34a", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateStatus(r.id, "REJECTED")}
                            style={{ padding: "6px 14px", background: "#ef4444", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TASKS TABLE */}
      {activeTab === "tasks" && (
        <div className="table-card">
          <h3>All Tasks</h3>
          {tasks.length === 0 ? (
            <p style={{ color: "#6b7280", padding: "20px 0" }}>No tasks yet. Approve a request to create tasks.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(t => (
                  <tr key={t.id}>
                    <td>{t.id}</td>
                    <td>{t.title}</td>
                    <td>
                      <span className={`status`} style={{
                        background: t.priority === "HIGH" ? "#fee2e2" : t.priority === "MEDIUM" ? "#fef3c7" : "#dcfce7",
                        color: t.priority === "HIGH" ? "#991b1b" : t.priority === "MEDIUM" ? "#92400e" : "#166534"
                      }}>
                        {t.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`status ${t.status.toLowerCase().replace("_", "")}`}>
                        {t.status}
                      </span>
                    </td>
                    <td>{t.assigned_to || "Unassigned"}</td>
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

export default ManagerDashboard