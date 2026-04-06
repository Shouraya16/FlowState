import { useEffect, useState } from "react"
import { apiFetch } from "../utils/apiFetch"

const statusColors = {
  TODO:               { bg: "#f3f4f6", color: "#374151" },
  DESIGN_IN_PROGRESS: { bg: "#fce7f3", color: "#9d174d" },
  DESIGN_COMPLETE:    { bg: "#f3e8ff", color: "#6b21a8" },
  IN_PROGRESS:        { bg: "#dbeafe", color: "#1e40af" },
  DONE:               { bg: "#dcfce7", color: "#166534" },
}

const priorityColors = {
  HIGH:   { bg: "#fee2e2", color: "#991b1b" },
  MEDIUM: { bg: "#fef9c3", color: "#854d0e" },
  LOW:    { bg: "#dcfce7", color: "#166534" },
}

function DesignerDashboard() {

  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [assetUrl, setAssetUrl] = useState("")
  const [uploadingFor, setUploadingFor] = useState(null)

  useEffect(() => {
    apiFetch("/tasks/my-tasks")
      .then(res => res.json())
      .then(data => {
        setTasks(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const markDesignComplete = async (taskId) => {
    const res = await apiFetch(`/tasks/${taskId}/status?status=DESIGN_COMPLETE`, {
      method: "PATCH"
    })
    if (res.ok) {
      const data = await res.json()
      // Remove this task from designer's view since it's now assigned to a developer
      setTasks(prev => prev.filter(t => t.id !== taskId))
      alert(`Design complete! Task reassigned to Developer #${data.assigned_to_developer ?? "—"}.`)
    } else {
      alert("Failed to mark design complete")
    }
  }

  const uploadAsset = async (taskId) => {
    if (!assetUrl.trim()) {
      alert("Please enter a Figma or asset URL")
      return
    }
    const res = await apiFetch(`/tasks/${taskId}/assets`, {
      method: "POST",
      body: JSON.stringify({ asset_url: assetUrl })
    })
    if (res.ok) {
      alert("Asset URL saved!")
      setAssetUrl("")
      setUploadingFor(null)
    } else {
      alert("Failed to save asset URL")
    }
  }

  return (
    <div style={{ padding: "40px 60px" }}>

      <div className="dash-header">
        <div>
          <h1>Designer Dashboard</h1>
          <p style={{ color: "#6b7280", marginTop: "5px" }}>
            Complete design tasks and hand off to development
          </p>
        </div>
      </div>

      {/* STATS */}
      <div className="stats">
        <div className="stat-card">
          <h2>{tasks.length}</h2>
          <p>My Tasks</p>
        </div>
        <div className="stat-card">
          <h2>{tasks.filter(t => t.status === "DESIGN_IN_PROGRESS").length}</h2>
          <p>In Progress</p>
        </div>
        <div className="stat-card">
          <h2>{tasks.filter(t => t.status === "TODO").length}</h2>
          <p>To Do</p>
        </div>
      </div>

      {/* WORKFLOW HINT */}
      <div style={{
        background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px",
        padding: "12px 16px", marginBottom: "24px", fontSize: "13px", color: "#166534"
      }}>
        <strong>Workflow:</strong> Complete your design work → click <strong>Mark Design Complete</strong> → task automatically reassigns to a Developer.
      </div>

      {/* TASKS TABLE */}
      <div className="table-card">
        <h3>🎨 My Design Tasks</h3>

        {loading ? (
          <p style={{ color: "#6b7280", padding: "20px 0" }}>Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p style={{ color: "#6b7280", padding: "20px 0" }}>No design tasks assigned yet. They'll appear here when a manager approves a request.</p>
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
                <>
                  <tr key={task.id}>
                    <td>{task.id}</td>
                    <td>{task.title}</td>
                    <td>
                      <span className="status" style={priorityColors[task.priority] || priorityColors.MEDIUM}>
                        {task.priority}
                      </span>
                    </td>
                    <td>
                      <span className="status" style={statusColors[task.status] || statusColors.TODO}>
                        {task.status?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>

                        {/* Main action — complete design and hand off to developer */}
                        {(task.status === "TODO" || task.status === "DESIGN_IN_PROGRESS") && (
                          <button
                            onClick={() => markDesignComplete(task.id)}
                            style={{
                              padding: "6px 14px", background: "#7c3aed", color: "white",
                              border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px"
                            }}
                          >
                            ✓ Mark Design Complete
                          </button>
                        )}

                        {/* Asset upload toggle */}
                        <button
                          onClick={() => setUploadingFor(uploadingFor === task.id ? null : task.id)}
                          style={{
                            padding: "6px 12px", background: "#5b5bf7", color: "white",
                            border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px"
                          }}
                        >
                          {uploadingFor === task.id ? "Cancel" : "Upload Asset"}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* ASSET UPLOAD INLINE ROW */}
                  {uploadingFor === task.id && (
                    <tr key={`asset-${task.id}`}>
                      <td colSpan="5" style={{ background: "#f8fafc", padding: "12px 16px" }}>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                          <input
                            type="text"
                            placeholder="Paste Figma link or asset URL..."
                            value={assetUrl}
                            onChange={e => setAssetUrl(e.target.value)}
                            style={{
                              flex: 1, padding: "8px 12px", borderRadius: "8px",
                              border: "1px solid #ddd", fontSize: "13px"
                            }}
                          />
                          <button
                            onClick={() => uploadAsset(task.id)}
                            style={{
                              padding: "8px 16px", background: "#5b5bf7", color: "white",
                              border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px"
                            }}
                          >
                            Save
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  )
}

export default DesignerDashboard