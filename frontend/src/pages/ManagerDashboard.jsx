import { useEffect, useState } from "react"

function ManagerDashboard() {
  const [requests, setRequests] = useState([])
  const [filter, setFilter] = useState("PENDING")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [taskModal, setTaskModal] = useState(null)  // holds the request to create task from
  const [taskTitle, setTaskTitle] = useState("")
  const [taskPriority, setTaskPriority] = useState("MEDIUM")
  const [creating, setCreating] = useState(false)

  const token = localStorage.getItem("token")

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const res = await fetch("http://localhost:8000/requests", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setRequests(data)
    } catch {
      setError("Could not load requests.")
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id, status) => {
    const res = await fetch(
      `http://localhost:8000/requests/${id}/status?status=${status}`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      }
    )
    if (!res.ok) {
      const data = await res.json()
      alert(data.detail || "Failed to update status")
      return
    }
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  }

  const createTask = async () => {
    if (!taskTitle.trim()) {
      alert("Please enter a task title")
      return
    }
    setCreating(true)
    try {
      const res = await fetch("http://localhost:8000/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          request_id: taskModal.id,
          title: taskTitle,
          priority: taskPriority
        })
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.detail || "Failed to create task")
        return
      }
      alert(`Task created and auto-assigned! Task ID: ${data.task_id}`)
      setTaskModal(null)
      setTaskTitle("")
      setTaskPriority("MEDIUM")
      // Refresh requests to show updated status
      fetchRequests()
    } catch {
      alert("Server error. Try again.")
    } finally {
      setCreating(false)
    }
  }

  if (loading) return <div className="dashboard"><p>Loading...</p></div>
  if (error) return <div className="dashboard"><p style={{ color: "red" }}>{error}</p></div>

  const pending = requests.filter(r => r.status === "PENDING")
  const displayed = filter === "ALL" ? requests : pending

  const statusClass = (s) => {
    const map = { PENDING: "pending", APPROVED: "approved", REJECTED: "rejected", IN_PROGRESS: "inprogress" }
    return map[s] || ""
  }

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div>
          <h1>Manager Dashboard</h1>
          <p style={{ color: "#6b7280" }}>Review requests and convert them to tasks</p>
        </div>
      </div>

      {/* STATS */}
      <div className="stats">
        <div
          className={`stat-card ${filter === "PENDING" ? "active" : ""}`}
          onClick={() => setFilter("PENDING")}
          style={{ cursor: "pointer" }}
        >
          <h2>{pending.length}</h2>
          <p>Pending Approvals</p>
        </div>
        <div
          className={`stat-card ${filter === "ALL" ? "active" : ""}`}
          onClick={() => setFilter("ALL")}
          style={{ cursor: "pointer" }}
        >
          <h2>{requests.length}</h2>
          <p>Total Requests</p>
        </div>
        <div className="stat-card">
          <h2>{requests.filter(r => r.status === "APPROVED").length}</h2>
          <p>Approved</p>
        </div>
        <div className="stat-card">
          <h2>{requests.filter(r => r.status === "IN_PROGRESS").length}</h2>
          <p>In Progress</p>
        </div>
      </div>

      {/* TABLE */}
      <div className="table-card">
        <h3>{filter === "ALL" ? "All Requests" : "Pending Requests"}</h3>

        {displayed.length === 0 ? (
          <p style={{ color: "#6b7280", padding: "16px 0" }}>No requests to show.</p>
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
                  <td style={{ fontSize: "13px", color: "#6b7280", maxWidth: "200px" }}>
                    {r.description}
                  </td>
                  <td>
                    <span className={`status ${statusClass(r.status)}`}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {r.status === "PENDING" && (
                        <>
                          <button
                            className="approve-btn action-btn"
                            onClick={() => updateStatus(r.id, "APPROVED")}
                          >
                            Approve
                          </button>
                          <button
                            className="reject-btn action-btn"
                            onClick={() => updateStatus(r.id, "REJECTED")}
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {r.status === "APPROVED" && (
                        <button
                          className="action-btn"
                          style={{ background: "#5b5bf7", color: "white", border: "none" }}
                          onClick={() => {
                            setTaskModal(r)
                            setTaskTitle(r.title)
                          }}
                        >
                          Create Task →
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* TASK CREATION MODAL */}
      {taskModal && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "white", borderRadius: "14px",
            padding: "32px", width: "420px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)"
          }}>
            <h3 style={{ marginTop: 0 }}>Create Task from Request</h3>
            <p style={{ color: "#6b7280", fontSize: "13px" }}>
              Request: <strong>{taskModal.title}</strong>
            </p>

            <label style={{ fontSize: "13px", fontWeight: 500 }}>Task Title</label>
            <input
              type="text"
              value={taskTitle}
              onChange={e => setTaskTitle(e.target.value)}
              style={{
                width: "100%", padding: "10px", marginTop: "6px", marginBottom: "14px",
                borderRadius: "8px", border: "1px solid #ddd", boxSizing: "border-box"
              }}
            />

            <label style={{ fontSize: "13px", fontWeight: 500 }}>Priority</label>
            <select
              value={taskPriority}
              onChange={e => setTaskPriority(e.target.value)}
              style={{
                width: "100%", padding: "10px", marginTop: "6px", marginBottom: "20px",
                borderRadius: "8px", border: "1px solid #ddd"
              }}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>

            <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "16px" }}>
              The task will be automatically assigned to the developer with the lowest workload.
            </p>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setTaskModal(null)}
                style={{
                  padding: "10px 20px", borderRadius: "8px",
                  border: "1px solid #ddd", background: "white", cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={createTask}
                disabled={creating}
                style={{
                  padding: "10px 20px", borderRadius: "8px",
                  background: "#5b5bf7", color: "white",
                  border: "none", cursor: "pointer", fontWeight: 500
                }}
              >
                {creating ? "Creating..." : "Create & Assign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManagerDashboard