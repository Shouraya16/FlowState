import { useEffect, useState } from "react"

const statusColors = {
  TODO: { bg: "#f3f4f6", color: "#374151" },
  IN_PROGRESS: { bg: "#dbeafe", color: "#1e40af" },
  READY_FOR_QA: { bg: "#fef3c7", color: "#92400e" },
  DONE: { bg: "#dcfce7", color: "#166534" },
}

const priorityColors = {
  HIGH: { bg: "#fee2e2", color: "#991b1b" },
  MEDIUM: { bg: "#fef9c3", color: "#854d0e" },
  LOW: { bg: "#dcfce7", color: "#166534" },
}

// The valid next status a developer can move a task to
const NEXT_STATUS = {
  TODO: "IN_PROGRESS",
  IN_PROGRESS: "READY_FOR_QA",
  READY_FOR_QA: null,
  DONE: null,
}

const NEXT_LABEL = {
  TODO: "Start Task",
  IN_PROGRESS: "Send to QA",
  READY_FOR_QA: null,
  DONE: null,
}

function DeveloperDashboard() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [updating, setUpdating] = useState(null)

  const token = localStorage.getItem("token")

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const res = await fetch("http://localhost:8000/tasks/my-tasks", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error("Failed to fetch tasks")
      const data = await res.json()
      setTasks(data)
    } catch (err) {
      setError("Could not load tasks. Make sure you are logged in.")
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (taskId, newStatus) => {
    setUpdating(taskId)
    try {
      const res = await fetch(`http://localhost:8000/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.detail || "Failed to update status")
        return
      }
      // Update locally without full reload
      setTasks(prev =>
        prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
      )
    } catch {
      alert("Server error. Try again.")
    } finally {
      setUpdating(null)
    }
  }

  if (loading) return <div className="dashboard"><p>Loading tasks...</p></div>
  if (error) return <div className="dashboard"><p style={{ color: "red" }}>{error}</p></div>

  const todo = tasks.filter(t => t.status === "TODO").length
  const inProgress = tasks.filter(t => t.status === "IN_PROGRESS").length
  const inQA = tasks.filter(t => t.status === "READY_FOR_QA").length
  const done = tasks.filter(t => t.status === "DONE").length

  return (
    <div className="dash-wrapper">
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Developer Dashboard</h1>
          <p className="dash-subtitle">Your assigned tasks and development progress</p>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-number">{tasks.length}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{todo}</span>
          <span className="stat-label">To Do</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{inProgress}</span>
          <span className="stat-label">In Progress</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{inQA}</span>
          <span className="stat-label">In QA</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{done}</span>
          <span className="stat-label">Done</span>
        </div>
      </div>

      <div className="dash-card">
        <h3 className="card-title">🛠️ My Tasks</h3>
        {tasks.length === 0 ? (
          <p style={{ color: "#6b7280", padding: "20px 0" }}>No tasks assigned yet.</p>
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Task</th>
                <th>Branch</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task.id}>
                  <td>{task.id}</td>
                  <td>{task.title}</td>
                  <td>
                    <code className="branch-tag">
                      {task.git_branch || `feature/task-${task.id}`}
                    </code>
                  </td>
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
                    {NEXT_STATUS[task.status] && (
                      <button
                        className="action-btn approve-btn"
                        disabled={updating === task.id}
                        onClick={() => updateStatus(task.id, NEXT_STATUS[task.status])}
                      >
                        {updating === task.id ? "..." : NEXT_LABEL[task.status]}
                      </button>
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

export default DeveloperDashboard