import { useEffect, useState } from "react"
import { apiFetch } from "../utils/apiFetch"

const statusColors = {
  TODO:            { bg: "#f3f4f6", color: "#374151" },
  IN_PROGRESS:     { bg: "#dbeafe", color: "#1e40af" },
  DONE:            { bg: "#dcfce7", color: "#166534" },
  READY_FOR_QA:    { bg: "#f3e8ff", color: "#6b21a8" },
  FAILED:          { bg: "#fee2e2", color: "#991b1b" },
  READY_TO_DEPLOY: { bg: "#fef9c3", color: "#854d0e" },
}

const priorityColors = {
  HIGH:   { bg: "#fee2e2", color: "#991b1b" },
  MEDIUM: { bg: "#fef9c3", color: "#854d0e" },
  LOW:    { bg: "#dcfce7", color: "#166534" },
}

function DeveloperDashboard() {

  const [tasks, setTasks]         = useState([])
  const [loading, setLoading]     = useState(true)

  // Per-task GitHub link input state: { [taskId]: "url string" }
  const [gitLinks, setGitLinks]   = useState({})

  // Per-task UI state: "idle" | "saving" | "submitting"
  const [taskState, setTaskState] = useState({})

  // QA failure feedback banner: { taskId, message } | null
  const [qaFeedback, setQaFeedback] = useState(null)

  // ── Fetch tasks on mount ─────────────────────────────────────────
  useEffect(() => {
    apiFetch("/tasks/my-tasks")
      .then(res => res.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : []
        setTasks(arr)

        // Pre-fill gitLinks input with existing git_branch values
        const links = {}
        arr.forEach(t => { if (t.git_branch) links[t.id] = t.git_branch })
        setGitLinks(links)

        // Detect any tasks that came back FAILED from QA
        const failed = arr.find(t => t.status === "FAILED" || t.status === "IN_PROGRESS")
        if (failed && failed.status === "IN_PROGRESS" && failed.git_branch) {
          // Could surface a note — handled below in the row render
        }

        setLoading(false)
      })
      .catch(err => {
        console.error("Failed to fetch tasks:", err)
        setLoading(false)
      })
  }, [])

  // ── Start a task (TODO → IN_PROGRESS) ────────────────────────────
  const startTask = async (taskId) => {
    setTaskState(s => ({ ...s, [taskId]: "saving" }))
    const res = await apiFetch(`/tasks/${taskId}/status?status=IN_PROGRESS`, {
      method: "PATCH"
    })
    if (res.ok) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "IN_PROGRESS" } : t))
    } else {
      alert("Failed to start task.")
    }
    setTaskState(s => ({ ...s, [taskId]: "idle" }))
  }

  // ── Save GitHub link ──────────────────────────────────────────────
  const saveGitLink = async (taskId) => {
    const link = gitLinks[taskId]?.trim()
    if (!link) {
      alert("Please enter a GitHub repository or PR link first.")
      return
    }
    setTaskState(s => ({ ...s, [taskId]: "saving" }))
    const res = await apiFetch(`/tasks/${taskId}/git-link`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ git_link: link })
    })
    if (res.ok) {
      const updated = await res.json()
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, git_branch: updated.git_branch } : t))
      alert("GitHub link saved!")
    } else {
      alert("Failed to save GitHub link.")
    }
    setTaskState(s => ({ ...s, [taskId]: "idle" }))
  }

  // ── Submit for QA ─────────────────────────────────────────────────
  const submitForQA = async (taskId) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task?.git_branch) {
      alert("Please save a GitHub link before submitting for QA.")
      return
    }
    if (!window.confirm("Submit this task for QA? It will be sent to the Tester with your GitHub link.")) return

    setTaskState(s => ({ ...s, [taskId]: "submitting" }))
    const res = await apiFetch(`/tasks/${taskId}/submit-for-qa`, {
      method: "PATCH"
    })
    if (res.ok) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "READY_FOR_QA" } : t))
    } else {
      const err = await res.json().catch(() => ({}))
      alert(err.detail || "Failed to submit for QA.")
    }
    setTaskState(s => ({ ...s, [taskId]: "idle" }))
  }

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="dash-wrapper" style={{ padding: "40px 60px" }}>

      <div className="dash-header">
        <div>
          <h1>Developer Dashboard</h1>
          <p style={{ color: "#6b7280", marginTop: "5px" }}>
            Your assigned tasks — attach a GitHub link and submit for QA when done
          </p>
        </div>
      </div>

      {/* ── STATS ── */}
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
          <h2>{tasks.filter(t => t.status === "READY_FOR_QA").length}</h2>
          <p>In QA</p>
        </div>
      </div>

      {/* ── QA FAILED BANNER ── */}
      {tasks.some(t => t.status === "IN_PROGRESS" && t.git_branch) && (
        <div style={{
          background: "#fee2e2", border: "1px solid #fca5a5",
          borderRadius: "12px", padding: "14px 20px",
          marginBottom: "24px", color: "#991b1b",
          display: "flex", alignItems: "center", gap: "10px"
        }}>
          <span style={{ fontSize: "18px" }}>⚠️</span>
          <span>
            <strong>QA Feedback:</strong> One or more of your tasks failed QA and has been returned.
            Please review the GitHub link, fix the issues, and resubmit.
          </span>
        </div>
      )}

      {/* ── TASKS TABLE ── */}
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
                <th>Priority</th>
                <th>Status</th>
                <th style={{ minWidth: "280px" }}>GitHub Link</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => {
                const busy = taskState[task.id] === "saving" || taskState[task.id] === "submitting"
                const inQA = task.status === "READY_FOR_QA"
                const isDone = task.status === "READY_TO_DEPLOY" || task.status === "DEPLOYED"
                const canEdit = !inQA && !isDone

                return (
                  <tr key={task.id} style={
                    task.status === "IN_PROGRESS" && task.git_branch
                      ? { background: "#fff7f7" }  // subtle highlight for returned-from-QA tasks
                      : {}
                  }>
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
                      <span className="status" style={statusColors[task.status] || statusColors.TODO}>
                        {task.status?.replace(/_/g, " ")}
                      </span>
                    </td>

                    {/* GitHub Link */}
                    <td>
                      {inQA || isDone ? (
                        /* Read-only when in QA or deployed */
                        task.git_branch ? (
                          <a
                            href={task.git_branch}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#6b21a8", fontSize: "13px",
                              textDecoration: "none", fontWeight: "500",
                              display: "flex", alignItems: "center", gap: "4px"
                            }}
                          >
                            🔗 {task.git_branch.length > 40
                              ? task.git_branch.slice(0, 40) + "…"
                              : task.git_branch}
                          </a>
                        ) : (
                          <span style={{ color: "#9ca3af", fontSize: "13px" }}>No link</span>
                        )
                      ) : (
                        /* Editable input */
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <input
                            type="url"
                            placeholder="https://github.com/..."
                            value={gitLinks[task.id] || ""}
                            onChange={e => setGitLinks(s => ({ ...s, [task.id]: e.target.value }))}
                            disabled={busy}
                            style={{
                              flex: 1, padding: "6px 10px", fontSize: "12px",
                              border: "1px solid #e5e7eb", borderRadius: "8px",
                              background: "#fafafa", minWidth: "180px",
                              margin: 0, marginBottom: 0
                            }}
                          />
                          <button
                            onClick={() => saveGitLink(task.id)}
                            disabled={busy}
                            style={{
                              padding: "6px 12px", background: "#6b21a8",
                              color: "white", border: "none", borderRadius: "8px",
                              cursor: "pointer", fontSize: "12px", whiteSpace: "nowrap",
                              width: "auto"
                            }}
                          >
                            {taskState[task.id] === "saving" ? "Saving…" : "Save"}
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td>
                      {task.status === "TODO" && (
                        <button
                          onClick={() => startTask(task.id)}
                          disabled={busy}
                          style={{
                            padding: "6px 14px", background: "#3b82f6",
                            color: "white", border: "none", borderRadius: "8px",
                            cursor: "pointer", fontSize: "13px", width: "auto"
                          }}
                        >
                          Start
                        </button>
                      )}

                      {task.status === "IN_PROGRESS" && (
                        <button
                          onClick={() => submitForQA(task.id)}
                          disabled={busy || !task.git_branch}
                          title={!task.git_branch ? "Save a GitHub link first" : "Submit to Tester for QA"}
                          style={{
                            padding: "6px 14px",
                            background: task.git_branch ? "#7c3aed" : "#d1d5db",
                            color: task.git_branch ? "white" : "#9ca3af",
                            border: "none", borderRadius: "8px",
                            cursor: task.git_branch ? "pointer" : "not-allowed",
                            fontSize: "13px", whiteSpace: "nowrap", width: "auto"
                          }}
                        >
                          {taskState[task.id] === "submitting" ? "Submitting…" : "Submit for QA →"}
                        </button>
                      )}

                      {task.status === "READY_FOR_QA" && (
                        <span style={{ color: "#6b21a8", fontSize: "13px", fontWeight: "500" }}>
                          🔍 With Tester
                        </span>
                      )}

                      {task.status === "READY_TO_DEPLOY" && (
                        <span style={{ color: "#854d0e", fontSize: "13px", fontWeight: "500" }}>
                          ✅ QA Passed
                        </span>
                      )}

                      {task.status === "DEPLOYED" && (
                        <span style={{ color: "#166534", fontSize: "13px", fontWeight: "500" }}>
                          🚀 Deployed
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

    </div>
  )
}

export default DeveloperDashboard