import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

function ClientDashboard(){

  const [requests, setRequests] = useState([])

  useEffect(() => {
    fetch("http://localhost:8000/requests")
      .then(res => res.json())
      .then(data => setRequests(data))
  }, [])

  const total = requests.length
  const pending = requests.filter(r => r.status === "PENDING").length
  const inProgress = requests.filter(r => r.status === "IN_PROGRESS").length

  return(
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
          <h2>{inProgress}</h2>
          <p>In Progress</p>
        </div>

      </div>

      {/* TABLE */}
      <div className="table-card">

        <h3>Your Requests</h3>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Title</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {requests.map((req) => (
              <tr key={req.id}>
                <td>{req.id}</td>
                <td>{req.title}</td>

                <td>
                  <span className={`status ${req.status.toLowerCase().replace("_","")}`}>
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