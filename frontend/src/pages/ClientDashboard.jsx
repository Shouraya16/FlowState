import { Link } from "react-router-dom"

const mockRequests = [
  { id: 1, title: "Add Dark Mode", status: "IN_PROGRESS", date: "2025-03-01" },
  { id: 2, title: "Export to PDF", status: "PENDING", date: "2025-03-05" },
  { id: 3, title: "Email Notifications", status: "APPROVED", date: "2025-02-20" },
  { id: 4, title: "Mobile App Support", status: "REJECTED", date: "2025-02-10" },
];

const statusColors = {
  PENDING: { background: "#fef9c3", color: "#854d0e" },
  APPROVED: { background: "#dcfce7", color: "#166534" },
  IN_PROGRESS: { background: "#dbeafe", color: "#1e40af" },
  REJECTED: { background: "#fee2e2", color: "#991b1b" },
};

function ClientDashboard() {

return (

<div className="dash-wrapper">

<div className="dash-header">

<div>
<h1 className="dash-title">My Feature Requests</h1>
<p className="dash-subtitle">
Track the status of your submitted requests
</p>
</div>

<Link to="/feature">
<button className="dash-primary-btn">+ New Request</button>
</Link>

</div>

<div className="stats-row">

<div className="stat-card">
<span className="stat-number">{mockRequests.length}</span>
<span className="stat-label">Total Requests</span>
</div>

<div className="stat-card">
<span className="stat-number">
{mockRequests.filter(r => r.status === "PENDING").length}
</span>
<span className="stat-label">Pending</span>
</div>

<div className="stat-card">
<span className="stat-number">
{mockRequests.filter(r => r.status === "IN_PROGRESS").length}
</span>
<span className="stat-label">In Progress</span>
</div>

</div>

<div className="dash-card">

<h3 className="card-title">Your Requests</h3>

<table className="dash-table">

<thead>
<tr>
<th>#</th>
<th>Title</th>
<th>Date Submitted</th>
<th>Status</th>
</tr>
</thead>

<tbody>

{mockRequests.map(req => (

<tr key={req.id}>

<td>{req.id}</td>
<td>{req.title}</td>
<td>{req.date}</td>

<td>
<span
className="status-badge"
style={statusColors[req.status]}
>
{req.status}
</span>
</td>

</tr>

))}

</tbody>

</table>

</div>

</div>

)

}

export default ClientDashboard