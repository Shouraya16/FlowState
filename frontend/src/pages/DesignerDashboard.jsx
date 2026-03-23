import { useEffect, useState } from "react"
import { apiFetch } from "../utils/apiFetch"

const statusColors = {
  TODO: { bg: "#f3f4f6", color: "#374151" },
  IN_PROGRESS: { bg: "#dbeafe", color: "#1e40af" },
  DONE: { bg: "#dcfce7", color: "#166534" },
  COMPLETED: { bg: "#dcfce7", color: "#166534" },
}

const priorityColors = {
  HIGH: { bg: "#fee2e2", color: "#991b1b" },
  MEDIUM: { bg: "#fef9c3", color: "#854d0e" },
  LOW: { bg: "#dcfce7", color: "#166534" },
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
      .catch(err => {
        console.error("Failed to fetch tasks:", err)
        setLoading(false)
      })
  }, [])

  const markComplete = async (taskId) => {
    const res = await apiFetch(`/tasks/${taskId}/status?status=DONE`, {
      method: "PATCH"
    })
    if (res.ok) {
      setTasks(prev =>
        prev.map(t => t.id === taskId ? { ...t, status: "DONE" } : t)
      )
    } else {
      alert("Failed to update task")
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
      alert("Failed to save asset. Make sure the endpoint exists.")
    }
  }

  return (
    <div style={{ padding: "40px 60px" }}>

      <div className="dash-header">
        <div>
          <h1>Designer Dashboard</h1>
          <p style={{ color: "#6b7280", marginTop: "5px" }}>Manage your design tasks and asset uploads</p>
        </div>
      </div>

      {/* STATS */}
      <div className="stats">
        <div className="stat-card">
          <h2>{tasks.length}</h2>
          <p>Total Tasks</p>
        </div>
        <div className="stat-card">
          <h2>{tasks.filter(t => t.status === "IN_PROGRESS").length}</h2>
          <p>In Progress</p>
        </div>
        <div className="stat-card">
          <h2>{tasks.filter(t => t.status === "DONE" || t.status === "COMPLETED").length}</h2>
          <p>Completed</p>
        </div>
        <div className="stat-card">
          <h2>{tasks.filter(t => t.status === "TODO").length}</h2>
          <p>To Do</p>
        </div>
      </div>

      {/* DESIGN TASKS TABLE */}
      <div className="table-card">
        <h3>🎨 My Design Tasks</h3>

        {loading ? (
          <p style={{ color: "#6b7280", padding: "20px 0" }}>Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p style={{ color: "#6b7280", padding: "20px 0" }}>No design tasks assigned yet.</p>
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
                        {task.status?.replace("_", " ")}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {(task.status === "TODO" || task.status === "IN_PROGRESS") && (
                          <button
                            onClick={() => markComplete(task.id)}
                            style={{ padding: "6px 12px", background: "#16a34a", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}
                          >
                            Mark Complete
                          </button>
                        )}
                        <button
                          onClick={() => setUploadingFor(uploadingFor === task.id ? null : task.id)}
                          style={{ padding: "6px 12px", background: "#5b5bf7", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}
                        >
                          {uploadingFor === task.id ? "Cancel" : "Upload Asset"}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* ASSET UPLOAD ROW */}
                  {uploadingFor === task.id && (
                    <tr key={`asset-${task.id}`}>
                      <td colSpan="5" style={{ background: "#f8fafc", padding: "12px 16px" }}>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                          <input
                            type="text"
                            placeholder="Paste Figma link or asset URL..."
                            value={assetUrl}
                            onChange={e => setAssetUrl(e.target.value)}
                            style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "13px" }}
                          />
                          <button
                            onClick={() => uploadAsset(task.id)}
                            style={{ padding: "8px 16px", background: "#5b5bf7", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}
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