import { useEffect, useState } from "react"
import { apiFetch } from "../utils/apiFetch"

const taskStatusStyle = (status) => {
  const map = {
    DESIGN_IN_PROGRESS: { background: "#fce7f3", color: "#9d174d" },
    DESIGN_COMPLETE:    { background: "#f3e8ff", color: "#6b21a8" },
    IN_PROGRESS:        { background: "#dbeafe", color: "#1e40af" },
    READY_FOR_QA:       { background: "#fef9c3", color: "#854d0e" },
    READY_TO_DEPLOY:    { background: "#dcfce7", color: "#166534" },
    PASSED:             { background: "#dcfce7", color: "#166534" },
    FAILED:             { background: "#fee2e2", color: "#991b1b" },
    TODO:               { background: "#f3f4f6", color: "#374151" },
  }
  return map[status] || { background: "#f3f4f6", color: "#374151" }
}

const reqStatusStyle = (status) => {
  const map = {
    PENDING:     { background: "#fef3c7", color: "#92400e" },
    IN_PROGRESS: { background: "#dbeafe", color: "#1e40af" },
    REJECTED:    { background: "#fee2e2", color: "#991b1b" },
    COMPLETED:   { background: "#dcfce7", color: "#166534" },
    APPROVED:    { background: "#dcfce7", color: "#166534" },
  }
  return map[status] || { background: "#f3f4f6", color: "#374151" }
}

function ManagerDashboard() {

  const [requests, setRequests] = useState([])
  const [tasks, setTasks] = useState([])
  const [filter, setFilter] = useState("PENDING")
  const [activeTab, setActiveTab] = useState("requests")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    try {
      const [reqRes, taskRes] = await Promise.all([
        apiFetch("/requests"),
        apiFetch("/tasks")
      ])
      const reqData = await reqRes.json()
      const taskData = await taskRes.json()
      setRequests(Array.isArray(reqData) ? reqData : [])
      setTasks(Array.isArray(taskData) ? taskData : [])
    } catch (err) {
      console.error("Load error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id) => {
    const res = await apiFetch(`/requests/${id}/status?status=APPROVED`, {
      method: "PATCH"
    })
    if (res.ok) {
      const data = await res.json()
      await loadAll() // refresh everything
      if (data.task) {
        alert(
          `✅ Approved!\nTask #${data.task.task_id} created.\n` +
          `Status: ${data.task.status}\n` +
          `Assigned to Designer ID: ${data.task.assigned_to_designer ?? "No designer found — add a designer user first"}`
        )
      }
    } else {
      const err = await res.json()
      alert(`Error: ${err.detail}`)
    }
  }

  const handleReject = async (id) => {
    const res = await apiFetch(`/requests/${id}/status?status=REJECTED`, {
      method: "PATCH"
    })
    if (res.ok) {
      await loadAll()
    } else {
      alert("Failed to reject request")
    }
  }

  const pending = requests.filter(r => r.status === "PENDING")
  const displayed = filter === "ALL" ? requests : pending

  const tabBtn = (label, tab) => (
    <button
      onClick={() => setActiveTab(tab)}
      style={{
        padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "500",
        fontSize: "14px",
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
          <h1>Manager Dashboard</h1>
          <p style={{ color: "#6b7280", marginTop: "4px" }}>
            Approve requests to auto-create tasks and assign to designers
          </p>
        </div>
      </div>

      {/* STATS */}
      <div className="stats">
        <div className="stat-card" style={{ cursor: "pointer" }}
          onClick={() => { setFilter("PENDING"); setActiveTab("requests") }}>
          <h2 style={{ color: "#5b5bf7" }}>{pending.length}</h2>
          <p>Pending Approvals</p>
        </div>
        <div className="stat-card" style={{ cursor: "pointer" }}
          onClick={() => { setFilter("ALL"); setActiveTab("requests") }}>
          <h2 style={{ color: "#5b5bf7" }}>{requests.length}</h2>
          <p>Total Requests</p>
        </div>
        <div className="stat-card" style={{ cursor: "pointer" }}
          onClick={() => setActiveTab("tasks")}>
          <h2 style={{ color: "#5b5bf7" }}>{tasks.length}</h2>
          <p>Total Tasks</p>
        </div>
        <div className="stat-card">
          <h2 style={{ color: "#9d174d" }}>
            {tasks.filter(t => t.status === "DESIGN_IN_PROGRESS").length}
          </h2>
          <p>In Design</p>
        </div>
        <div className="stat-card">
          <h2 style={{ color: "#1e40af" }}>
            {tasks.filter(t => t.status === "IN_PROGRESS").length}
          </h2>
          <p>In Development</p>
        </div>
      </div>

      {/* WORKFLOW INFO */}
      <div style={{
        background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px",
        padding: "12px 18px", marginBottom: "22px", fontSize: "13px", color: "#166534",
        display: "flex", alignItems: "center", gap: "8px"
      }}>
        <span>⚡</span>
        <span>
          <strong>Auto-workflow:</strong> Approve → Task created + assigned to Designer →
          Designer completes → auto-assigned to Developer → Developer done → goes to QA
        </span>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        {tabBtn("Feature Requests", "requests")}
        {tabBtn("All Tasks", "tasks")}
      </div>

      {/* ---- REQUESTS TAB ---- */}
      {activeTab === "requests" && (
        <div className="table-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0 }}>
              {filter === "ALL" ? "All Requests" : "Pending Requests"}
            </h3>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setFilter("PENDING")}
                style={{
                  padding: "6px 14px", borderRadius: "6px", fontSize: "13px", cursor: "pointer",
                  background: filter === "PENDING" ? "#5b5bf7" : "white",
                  color: filter === "PENDING" ? "white" : "#374151",
                  border: "1px solid #e5e7eb"
                }}
              >
                Pending ({pending.length})
              </button>
              <button
                onClick={() => setFilter("ALL")}
                style={{
                  padding: "6px 14px", borderRadius: "6px", fontSize: "13px", cursor: "pointer",
                  background: filter === "ALL" ? "#5b5bf7" : "white",
                  color: filter === "ALL" ? "white" : "#374151",
                  border: "1px solid #e5e7eb"
                }}
              >
                All ({requests.length})
              </button>
            </div>
          </div>

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
                  <th>Request Status</th>
                  <th>Task Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map(r => (
                  <tr key={r.id}>
                    <td style={{ color: "#9ca3af", fontSize: "13px" }}>{r.id}</td>
                    <td style={{ fontWeight: "500" }}>{r.title}</td>
                    <td style={{
                      maxWidth: "220px", overflow: "hidden",
                      textOverflow: "ellipsis", whiteSpace: "nowrap",
                      color: "#6b7280", fontSize: "13px"
                    }}>
                      {r.description}
                    </td>

                    {/* REQUEST STATUS */}
                    <td>
                      <span className="status" style={reqStatusStyle(r.status)}>
                        {r.status}
                      </span>
                    </td>

                    {/* TASK STATUS — shows as soon as task is created */}
                    <td>
                      {r.task ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <span className="status" style={taskStatusStyle(r.task.status)}>
                            {r.task.status.replace(/_/g, " ")}
                          </span>
                          <span style={{ fontSize: "11px", color: "#9ca3af" }}>
                            Task #{r.task.id}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: "#d1d5db", fontSize: "18px" }}>—</span>
                      )}
                    </td>

                    {/* ACTIONS */}
                    <td>
                      {r.status === "PENDING" && (
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => handleApprove(r.id)}
                            style={{
                              padding: "6px 16px", background: "#16a34a", color: "white",
                              border: "none", borderRadius: "8px", cursor: "pointer",
                              fontSize: "13px", fontWeight: "500"
                            }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(r.id)}
                            style={{
                              padding: "6px 16px", background: "#ef4444", color: "white",
                              border: "none", borderRadius: "8px", cursor: "pointer",
                              fontSize: "13px", fontWeight: "500"
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {r.status === "IN_PROGRESS" && (
                        <span style={{ fontSize: "12px", color: "#6b7280" }}>
                          ✓ In progress
                        </span>
                      )}
                      {r.status === "REJECTED" && (
                        <span style={{ fontSize: "12px", color: "#ef4444" }}>
                          ✗ Rejected
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ---- TASKS TAB ---- */}
      {activeTab === "tasks" && (
        <div className="table-card">
          <h3>All Tasks</h3>
          {tasks.length === 0 ? (
            <p style={{ color: "#6b7280", padding: "20px 0" }}>
              No tasks yet. Approve a request to automatically create and assign a task.
            </p>
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
                    <td style={{ color: "#9ca3af", fontSize: "13px" }}>{t.id}</td>
                    <td style={{ fontWeight: "500" }}>{t.title}</td>
                    <td>
                      <span className="status" style={{
                        background: t.priority === "HIGH" ? "#fee2e2" : t.priority === "MEDIUM" ? "#fef3c7" : "#dcfce7",
                        color: t.priority === "HIGH" ? "#991b1b" : t.priority === "MEDIUM" ? "#92400e" : "#166534"
                      }}>
                        {t.priority}
                      </span>
                    </td>
                    <td>
                      <span className="status" style={taskStatusStyle(t.status)}>
                        {t.status?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td style={{ color: "#6b7280", fontSize: "13px" }}>
                      {t.assigned_to ? `Employee #${t.assigned_to}` : (
                        <span style={{ color: "#f59e0b" }}>⚠ Unassigned</span>
                      )}
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

export default ManagerDashboard