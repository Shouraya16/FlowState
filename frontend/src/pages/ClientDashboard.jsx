import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { apiFetch } from "../utils/apiFetch"

function ClientDashboard() {

  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch("/requests")
      .then(res => res.json())
      .then(data => {
        setRequests(data)
        setLoading(false)
      })
      .catch(err => {
        console.error("Failed to fetch requests:", err)
        setLoading(false)
      })
  }, [])

  const total = requests.length
  const pending = requests.filter(r => r.status === "PENDING").length
  const inProgress = requests.filter(r => r.status === "IN_PROGRESS").length
  const approved = requests.filter(r => r.status === "APPROVED").length

  return (
    <div className="dashboard">

      {/* HEADER */}
      <div className="dash-header">
        <div>
          <h1>My Feature Requests</h1>
          <p>Track the status of your submitted requests</p>
        </div>
        <Link to="/feature">
          <button className="primary-btn">+ New Request</button>
        </Link>
      </div>

      {/* STATS */}
      <div className="stats">
        <div className="stat-card">
          <h2>{total}</h2>
          <p>Total</p>
        </div>
        <div className="stat-card">
          <h2>{pending}</h2>
          <p>Pending</p>
        </div>
        <div className="stat-card">
          <h2>{approved}</h2>
          <p>Approved</p>
        </div>
        <div className="stat-card">
          <h2>{inProgress}</h2>
          <p>In Progress</p>
        </div>
      </div>

      {/* TABLE */}
      <div className="table-card">
        <h3>Your Requests</h3>

        {loading ? (
          <p style={{ color: "#6b7280", padding: "20px 0" }}>Loading...</p>
        ) : requests.length === 0 ? (
          <p style={{ color: "#6b7280", padding: "20px 0" }}>No requests yet. Submit your first one!</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Description</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id}>
                  <td>{req.id}</td>
                  <td>{req.title}</td>
                  <td>{req.description}</td>
                  <td>
                    <span className={`status ${req.status.toLowerCase().replace("_", "")}`}>
                      {req.status}
                    </span>
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

export default ClientDashboard