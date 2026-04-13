import { useEffect, useState } from "react"
import { apiFetch } from "../utils/apiFetch"

const statusColors = {
  READY_FOR_QA:    { bg: "#f3e8ff", color: "#6b21a8" },
  PASSED:          { bg: "#dcfce7", color: "#166534" },
  FAILED:          { bg: "#fee2e2", color: "#991b1b" },
  READY_TO_DEPLOY: { bg: "#fef9c3", color: "#854d0e" },
}

const priorityColors = {
  HIGH:   { bg: "#fee2e2", color: "#991b1b" },
  MEDIUM: { bg: "#fef9c3", color: "#854d0e" },
  LOW:    { bg: "#dcfce7", color: "#166534" },
}

function TesterDashboard() {

  const [tasks, setTasks]       = useState([])
  const [loading, setLoading]   = useState(true)

  // Per-task fail feedback text input state
  const [feedbacks, setFeedbacks] = useState({})

  // Per-task UI state: "idle" | "passing" | "failing"
  const [taskState, setTaskState] = useState({})

  // Which task's fail modal is open
  const [failModal, setFailModal] = useState(null) // taskId | null

  // ── Fetch QA tasks on mount ────────────────────────────────────────
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

  // ── Pass a task ───────────────────────────────────────────────────
  const passTask = async (taskId) => {
    setTaskState(s => ({ ...s, [taskId]: "passing" }))
    const res = await apiFetch(`/tasks/${taskId}/qa-result?result=pass`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedback: "" })
    })
    if (res.ok) {
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, status: "READY_TO_DEPLOY" } : t
      ))
    } else {
      alert("Failed to update QA result.")
    }
    setTaskState(s => ({ ...s, [taskId]: "idle" }))
  }

  // ── Fail a task (with feedback) ───────────────────────────────────
  const failTask = async (taskId) => {
    const feedback = feedbacks[taskId]?.trim() || "Task failed QA. Please review and fix."
    setTaskState(s => ({ ...s, [taskId]: "failing" }))
    const res = await apiFetch(`/tasks/${taskId}/qa-result?result=fail`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedback })
    })
    if (res.ok) {
      // Remove from this tester's view — it's been sent back to developer
      setTasks(prev => prev.filter(t => t.id !== taskId))
      setFailModal(null)
    } else {
      alert("Failed to update QA result.")
    }
    setTaskState(s => ({ ...s, [taskId]: "idle" }))
  }

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "40px 60px" }}>

      <div className="dash-header">
        <div>
          <h1>Tester Dashboard</h1>
          <p style={{ color: "#6b7280", marginTop: "5px" }}>
            Review developer submissions — check the GitHub link, then pass or fail
          </p>
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="stats">
        <div className="stat-card">
          <h2>{tasks.filter(t => t.status === "READY_FOR_QA").length}</h2>
          <p>Pending Review</p>
        </div>
        <div className="stat-card">
          <h2>{tasks.filter(t => t.status === "PASSED" || t.status === "READY_TO_DEPLOY").length}</h2>
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

      {/* ── QA TASKS TABLE ── */}
      <div className="table-card">
        <h3>🧪 QA Tasks</h3>

        {loading ? (
          <p style={{ color: "#6b7280", padding: "20px 0" }}>Loading...</p>
        ) : tasks.length === 0 ? (
          <p style={{ color: "#6b7280", padding: "20px 0" }}>No tasks pending QA review.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Task</th>
                <th>Priority</th>
                <th>Status</th>
                <th style={{ minWidth: "220px" }}>GitHub Link</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => {
                const busy = taskState[task.id] === "passing" || taskState[task.id] === "failing"

                return (
                  <tr key={task.id}>
                    {/* ID */}
                    <td>{task.id}</td>

                    {/* Title */}
                    <td style={{ fontWeight: "500" }}>{task.title}</td>

                    {/* Priority */}
                    <td>
                      <span className="status" style={priorityColors[task.priority] || priorityColors.MEDIUM}>
                        {task.priority}
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      <span className="status" style={statusColors[task.status] || statusColors.READY_FOR_QA}>
                        {task.status?.replace(/_/g, " ")}
                      </span>
                    </td>

                    {/* GitHub Link — forwarded from developer */}
                    <td>
                      {task.git_branch ? (
                        <a
                          href={task.git_branch}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-flex", alignItems: "center", gap: "6px",
                            background: "#f3e8ff", color: "#6b21a8",
                            padding: "6px 12px", borderRadius: "8px",
                            fontSize: "13px", textDecoration: "none",
                            fontWeight: "500", border: "1px solid #e9d5ff"
                          }}
                        >
                          🔗 Open Repo / PR
                        </a>
                      ) : (
                        <span style={{ color: "#9ca3af", fontSize: "13px" }}>
                          No link provided
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td>
                      {task.status === "READY_FOR_QA" && (
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => passTask(task.id)}
                            disabled={busy}
                            style={{
                              padding: "6px 14px", background: "#16a34a",
                              color: "white", border: "none", borderRadius: "8px",
                              cursor: "pointer", fontSize: "13px", width: "auto"
                            }}
                          >
                            {taskState[task.id] === "passing" ? "Passing…" : "Pass ✓"}
                          </button>
                          <button
                            onClick={() => setFailModal(task.id)}
                            disabled={busy}
                            style={{
                              padding: "6px 14px", background: "#ef4444",
                              color: "white", border: "none", borderRadius: "8px",
                              cursor: "pointer", fontSize: "13px", width: "auto"
                            }}
                          >
                            Fail ✗
                          </button>
                        </div>
                      )}

                      {(task.status === "PASSED" || task.status === "READY_TO_DEPLOY") && (
                        <span style={{ color: "#16a34a", fontSize: "13px", fontWeight: "500" }}>
                          ✓ Passed — Ready to Deploy
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── FAIL FEEDBACK MODAL ── */}
      {failModal !== null && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "white", borderRadius: "18px",
            padding: "36px", maxWidth: "460px", width: "90%",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)"
          }}>
            <h3 style={{ margin: "0 0 8px 0", color: "#1f2937" }}>
              ✗ Mark Task as Failed
            </h3>
            <p style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 20px 0" }}>
              Task #{failModal} will be sent back to the developer with your feedback.
            </p>

            <textarea
              placeholder="Describe what failed and what the developer should fix…"
              value={feedbacks[failModal] || ""}
              onChange={e => setFeedbacks(s => ({ ...s, [failModal]: e.target.value }))}
              rows={4}
              style={{
                width: "100%", padding: "12px 14px",
                border: "1px solid #e5e7eb", borderRadius: "12px",
                fontSize: "14px", fontFamily: "inherit",
                resize: "vertical", marginBottom: "20px",
                boxSizing: "border-box"
              }}
            />

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setFailModal(null)}
                style={{
                  padding: "10px 20px", background: "#f3f4f6",
                  color: "#374151", border: "none", borderRadius: "10px",
                  cursor: "pointer", width: "auto", fontWeight: "500"
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => failTask(failModal)}
                disabled={taskState[failModal] === "failing"}
                style={{
                  padding: "10px 20px", background: "#ef4444",
                  color: "white", border: "none", borderRadius: "10px",
                  cursor: "pointer", width: "auto", fontWeight: "500"
                }}
              >
                {taskState[failModal] === "failing" ? "Sending back…" : "Fail & Send Back"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default TesterDashboard