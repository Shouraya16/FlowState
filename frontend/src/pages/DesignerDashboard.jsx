// DesignerDashboard.jsx
// Shows design tasks assigned, asset upload status, and design tools

const mockDesignTasks = [
  { id: 301, title: "Landing Page Mockup", feature: "Add Dark Mode", status: "IN_PROGRESS", tool: "Figma" },
  { id: 302, title: "Dashboard UI Design", feature: "Analytics Feature", status: "COMPLETED", tool: "Figma" },
  { id: 303, title: "Mobile Layout", feature: "Mobile App Support", status: "TODO", tool: "Adobe XD" },
  { id: 304, title: "Icon Set", feature: "UI Revamp", status: "TODO", tool: "Illustrator" },
];

const statusColors = {
  TODO: { bg: "#f3f4f6", color: "#374151" },
  IN_PROGRESS: { bg: "#dbeafe", color: "#1e40af" },
  COMPLETED: { bg: "#dcfce7", color: "#166534" },
};

function DesignerDashboard() {
  return (
    <div className="dash-wrapper">
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Designer Dashboard</h1>
          <p className="dash-subtitle">Manage your design tasks and asset uploads</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-number">{mockDesignTasks.length}</span>
          <span className="stat-label">Total Tasks</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">
            {mockDesignTasks.filter((t) => t.status === "IN_PROGRESS").length}
          </span>
          <span className="stat-label">In Progress</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">
            {mockDesignTasks.filter((t) => t.status === "COMPLETED").length}
          </span>
          <span className="stat-label">Completed</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">
            {mockDesignTasks.filter((t) => t.status === "TODO").length}
          </span>
          <span className="stat-label">To Do</span>
        </div>
      </div>

      {/* Design Tasks Table */}
      <div className="dash-card">
        <h3 className="card-title">🎨 My Design Tasks</h3>
        <table className="dash-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Task</th>
              <th>Feature</th>
              <th>Tool</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {mockDesignTasks.map((task) => (
              <tr key={task.id}>
                <td>{task.id}</td>
                <td>{task.title}</td>
                <td>{task.feature}</td>
                <td>
                  <span className="tool-tag">{task.tool}</span>
                </td>
                <td>
                  <span className="status-badge" style={statusColors[task.status]}>
                    {task.status.replace("_", " ")}
                  </span>
                </td>
                <td>
                  {task.status !== "COMPLETED" && (
                    <button className="action-btn approve-btn">
                      Mark Complete
                    </button>
                  )}
                  {task.status === "COMPLETED" && (
                    <button className="action-btn" style={{ background: "#f3f4f6", color: "#374151" }}>
                      View Assets
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DesignerDashboard;
