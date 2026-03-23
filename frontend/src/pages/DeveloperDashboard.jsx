import { useEffect, useState } from "react"
import { apiFetch } from "../utils/apiFetch"

const statusColors = {
  TODO: { bg: "#f3f4f6", color: "#374151" },
  IN_PROGRESS: { bg: "#dbeafe", color: "#1e40af" },
  DONE: { bg: "#dcfce7", color: "#166534" },
  READY_FOR_QA: { bg: "#f3e8ff", color: "#6b21a8" },
}

const priorityColors = {
  HIGH: { bg: "#fee2e2", color: "#991b1b" },
  MEDIUM: { bg: "#fef9c3", color: "#854d0e" },
  LOW: { bg: "#dcfce7", color: "#166534" },
}

function DeveloperDashboard() {

  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch("/tasks/my-tasks")
      .then(res => res.json())
      .then(data => {
        setTasks(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(err => {
        console.error("Failed to fetch tasks:", err)
        setLoading(false)
      })
  }, [])

  const updateTaskStatus = async (taskId, newStatus) => {
    const res = await apiFetch(`/tasks/${taskId}/status?status=${newStatus}`, {
      method: "PATCH"
    })
    if (res.ok) {
      setTasks(prev =>
        prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
      )
    } else {
      alert("Failed to update task status")
    }
  }

  return (
    <div className="dash-wrapper" style={{ padding: "40px 60px" }}>

      <div className="dash-header">
        <div>
          <h1>Developer Dashboard</h1>
          <p style={{ color: "#6b7280", marginTop: "5px" }}>Your assigned tasks and development progress</p>
        </div>
      </div>

      {/* STATS */}
      <div className="stats">
        <div className="stat-card">
          <h2>{tasks.length}</h2>
          <p>Total Tasks</p>
        </div>
        <div className="stat-card">
          <h2>{tasks.filter(t => t.status === "TODO").length}</h2>
          <p>To Do</p>
        </div>
        <div className="stat-card">
          <h2>{tasks.filter(t => t.status === "IN_PROGRESS").length}</h2>
          <p>In Progress</p>
        </div>
        <div className="stat-card">
          <h2>{tasks.filter(t => t.status === "DONE").length}</h2>
          <p>Done</p>
        </div>
      </div>

      {/* TASKS TABLE */}
      <div className="table-card">
        <h3>🛠️ My Tasks</h3>

        {loading ? (
          <p style={{ color: "#6b7280", padding: "20px 0" }}>Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p style={{ color: "#6b7280", padding: "20px 0" }}>No tasks assigned yet.</p>
        ) : (
          <table>
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
                    <code style={{ background: "#f1f5f9", padding: "2px 8px", borderRadius: "4px", fontSize: "12px" }}>
                      {task.git_branch || "no-branch"}
                    </code>
                  </td>
                  <td>
                    <span className="status" style={priorityColors[task.priority] || priorityColors.MEDIUM}>
                      {task.priority}
                    </span>
                  </td>
                  <td>
                    <span className="status" style={statusColors[task.status] || statusColors.TODO}>
                      {task.status?.replace("_", " ")}
                    </span>
                  </td>
                  <td>
                    {task.status === "TODO" && (
                      <button
                        onClick={() => updateTaskStatus(task.id, "IN_PROGRESS")}
                        style={{ padding: "6px 12px", background: "#3b82f6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}
                      >
                        Start
                      </button>
                    )}
                    {task.status === "IN_PROGRESS" && (
                      <button
                        onClick={() => updateTaskStatus(task.id, "DONE")}
                        style={{ padding: "6px 12px", background: "#16a34a", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}
                      >
                        Mark Done
                      </button>
                    )}
                    {task.status === "DONE" && (
                      <span style={{ color: "#16a34a", fontSize: "13px", fontWeight: "500" }}>✓ Complete</span>
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