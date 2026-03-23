import { useEffect, useState } from "react"

const statusColors = {
  READY_FOR_QA: { bg: "#dbeafe", color: "#1e40af" },
  DONE: { bg: "#dcfce7", color: "#166534" },
  IN_PROGRESS: { bg: "#fee2e2", color: "#991b1b" }, // failed = sent back
}

const priorityColors = {
  HIGH: { bg: "#fee2e2", color: "#991b1b" },
  MEDIUM: { bg: "#fef9c3", color: "#854d0e" },
  LOW: { bg: "#dcfce7", color: "#166534" },
}

function TesterDashboard() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [processing, setProcessing] = useState(null)
  const [notes, setNotes] = useState({})

  const token = localStorage.getItem("token")

  useEffect(() => {
    fetchQATasks()
  }, [])

  const fetchQATasks = async () => {
    try {
      const res = await fetch("http://localhost:8000/qa/tasks", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error("Failed to fetch QA tasks")
      const data = await res.json()
      setTasks(data)
    } catch (err) {
      setError("Could not load QA tasks. Make sure you are logged in as a Tester.")
    } finally {
      setLoading(false)
    }
  }

  const submitResult = async (taskId, result) => {
    setProcessing(`${taskId}-${result}`)
    try {
      const res = await fetch(`http://localhost:8000/qa/tasks/${taskId}/result`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          result,
          notes: notes[taskId] || ""
        })
      })
      const data = await res.json()

      if (!res.ok) {
        alert(data.detail || "Failed to submit QA result")
        return
      }

      // Update status locally
      const newStatus = result === "pass" ? "DONE" : "IN_PROGRESS"
      setTasks(prev =>
        prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
      )

      alert(data.message)
    } catch {
      alert("Server error. Try again.")
    } finally {
      setProcessing(null)
    }
  }

  if (loading) return <div className="dashboard"><p>Loading QA tasks...</p></div>
  if (error) return <div className="dashboard"><p style={{ color: "red" }}>{error}</p></div>

  const readyCount = tasks.filter(t => t.status === "READY_FOR_QA").length
  const passedCount = tasks.filter(t => t.status === "DONE").length
  const failedCount = tasks.filter(t => t.status === "IN_PROGRESS").length

  return (
    <div className="dash-wrapper">
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Tester Dashboard</h1>
          <p className="dash-subtitle">Validate tasks and manage the QA pipeline</p>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-number">{readyCount}</span>
          <span className="stat-label">Ready for QA</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{passedCount}</span>
          <span className="stat-label">Passed</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{failedCount}</span>
          <span className="stat-label">Sent back</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{tasks.length}</span>
          <span className="stat-label">Total</span>
        </div>
      </div>

      <div className="dash-card">
        <h3 className="card-title">🧪 QA Tasks</h3>
        {tasks.length === 0 ? (
          <p style={{ color: "#6b7280", padding: "20px 0" }}>No tasks in the QA queue yet.</p>
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Task</th>
                <th>Developer</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task.id}>
                  <td>{task.id}</td>
                  <td>{task.title}</td>
                  <td style={{ fontSize: "12px", color: "#6b7280" }}>
                    {task.developer_email || "—"}
                  </td>
                  <td>
                    <span className="status-badge" style={priorityColors[task.priority]}>
                      {task.priority}
                    </span>
                  </td>
                  <td>
                    <span className="status-badge" style={statusColors[task.status] || {}}>
                      {task.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td>
                    {task.status === "READY_FOR_QA" && (
                      <input
                        type="text"
                        placeholder="Optional notes..."
                        value={notes[task.id] || ""}
                        onChange={e => setNotes(prev => ({ ...prev, [task.id]: e.target.value }))}
                        style={{
                          padding: "4px 8px",
                          borderRadius: "6px",
                          border: "1px solid #ddd",
                          fontSize: "12px",
                          width: "140px"
                        }}
                      />
                    )}
                  </td>
                  <td>
                    {task.status === "READY_FOR_QA" && (
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          className="action-btn approve-btn"
                          disabled={!!processing}
                          onClick={() => submitResult(task.id, "pass")}
                        >
                          {processing === `${task.id}-pass` ? "..." : "Pass ✓"}
                        </button>
                        <button
                          className="action-btn reject-btn"
                          disabled={!!processing}
                          onClick={() => submitResult(task.id, "fail")}
                        >
                          {processing === `${task.id}-fail` ? "..." : "Fail ✗"}
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
    </div>
  )
}

export default TesterDashboard