import { useEffect, useState } from "react"
import { apiFetch } from "../utils/apiFetch"

const statusColors = {
  TODO: { bg: "#f3f4f6", color: "#374151" },
  IN_PROGRESS: { bg: "#dbeafe", color: "#1e40af" },
  READY_FOR_QA: { bg: "#f3e8ff", color: "#6b21a8" },
  PASSED: { bg: "#dcfce7", color: "#166534" },
  FAILED: { bg: "#fee2e2", color: "#991b1b" },
  READY_TO_DEPLOY: { bg: "#fef9c3", color: "#854d0e" },
}

const priorityColors = {
  HIGH: { bg: "#fee2e2", color: "#991b1b" },
  MEDIUM: { bg: "#fef9c3", color: "#854d0e" },
  LOW: { bg: "#dcfce7", color: "#166534" },
}

function TesterDashboard() {

  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch("/tasks/qa-tasks")
      .then(res => res.json())
      .then(data => {
        setTasks(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(err => {
        console.error("Failed to fetch QA tasks:", err)
        setLoading(false)
      })
  }, [])

  const updateQAResult = async (taskId, result) => {
    const res = await apiFetch(`/tasks/${taskId}/qa-result?result=${result}`, {
      method: "PATCH"
    })
    if (res.ok) {
      setTasks(prev =>
        prev.map(t => t.id === taskId
          ? { ...t, status: result === "pass" ? "PASSED" : "FAILED" }
          : t
        )
      )
    } else {
      alert("Failed to update QA result")
    }
  }

  return (
    <div style={{ padding: "40px 60px" }}>

      <div className="dash-header">
        <div>
          <h1>Tester Dashboard</h1>
          <p style={{ color: "#6b7280", marginTop: "5px" }}>Validate tasks and manage QA pipeline</p>
        </div>
      </div>

      {/* STATS */}
      <div className="stats">
        <div className="stat-card">
          <h2>{tasks.filter(t => t.status === "READY_FOR_QA").length}</h2>
          <p>Ready for QA</p>
        </div>
        <div className="stat-card">
          <h2>{tasks.filter(t => t.status === "PASSED").length}</h2>
          <p>Passed</p>
        </div>
        <div className="stat-card">
          <h2>{tasks.filter(t => t.status === "FAILED").length}</h2>
          <p>Failed</p>
        </div>
        <div className="stat-card">
          <h2>{tasks.length}</h2>
          <p>Total</p>
        </div>
      </div>

      {/* QA TASKS TABLE */}
      <div className="table-card">
        <h3>🧪 QA Tasks</h3>

        {loading ? (
          <p style={{ color: "#6b7280", padding: "20px 0" }}>Loading...</p>
        ) : tasks.length === 0 ? (
          <p style={{ color: "#6b7280", padding: "20px 0" }}>No tasks ready for QA yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Task</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task.id}>
                  <td>{task.id}</td>
                  <td>{task.title}</td>
                  <td>
                    <span className="status" style={priorityColors[task.priority] || priorityColors.MEDIUM}>
                      {task.priority}
                    </span>
                  </td>
                  <td>
                    <span className="status" style={statusColors[task.status] || statusColors.READY_FOR_QA}>
                      {task.status?.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td>
                    {task.status === "READY_FOR_QA" && (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => updateQAResult(task.id, "pass")}
                          style={{ padding: "6px 12px", background: "#16a34a", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}
                        >
                          Pass ✓
                        </button>
                        <button
                          onClick={() => updateQAResult(task.id, "fail")}
                          style={{ padding: "6px 12px", background: "#ef4444", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}
                        >
                          Fail ✗
                        </button>
                      </div>
                    )}
                    {task.status === "PASSED" && (
                      <span style={{ color: "#16a34a", fontSize: "13px", fontWeight: "500" }}>✓ Passed</span>
                    )}
                    {task.status === "FAILED" && (
                      <span style={{ color: "#ef4444", fontSize: "13px", fontWeight: "500" }}>✗ Failed</span>
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