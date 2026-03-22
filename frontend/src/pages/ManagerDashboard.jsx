import { useEffect, useState } from "react"

function ManagerDashboard(){

  const [requests, setRequests] = useState([])
  const [filter, setFilter] = useState("PENDING") // default

  useEffect(() => {
    fetch("http://localhost:8000/requests")
      .then(res => res.json())
      .then(data => setRequests(data))
  }, [])

  const pending = requests.filter(r => r.status === "PENDING")
  const displayed =
    filter === "ALL"
      ? requests
      : requests.filter(r => r.status === "PENDING")

  const updateStatus = async (id, status) => {
    await fetch(`http://localhost:8000/requests/${id}/status?status=${status}`, {
      method: "PATCH"
    })

    // refresh without reload
    setRequests(prev =>
      prev.map(r => r.id === id ? {...r, status} : r)
    )
  }

  return(
    <div className="dashboard">

      <h1>Manager Dashboard</h1>

      {/* 🔥 CLICKABLE STATS */}
      <div className="stats">

        <div
          className={`stat-card ${filter==="PENDING" ? "active" : ""}`}
          onClick={() => setFilter("PENDING")}
        >
          <h2>{pending.length}</h2>
          <p>Pending Approvals</p>
        </div>

        <div
          className={`stat-card ${filter==="ALL" ? "active" : ""}`}
          onClick={() => setFilter("ALL")}
        >
          <h2>{requests.length}</h2>
          <p>Total Requests</p>
        </div>

      </div>

      {/* TABLE */}
      <div className="table-card">

        <h3>
          {filter === "ALL" ? "All Requests" : "Pending Requests"}
        </h3>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Title</th>
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {displayed.map(r => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.title}</td>
                <td>{r.description}</td>

                <td>
                  <span className={`status ${r.status.toLowerCase()}`}>
                    {r.status}
                  </span>
                </td>

                <td>
                  {r.status === "PENDING" && (
                    <>
                      <button
                        className="approve-btn"
                        onClick={() => updateStatus(r.id, "APPROVED")}
                      >
                        Approve
                      </button>

                      <button
                        className="reject-btn"
                        onClick={() => updateStatus(r.id, "REJECTED")}
                      >
                        Reject
                      </button>
                    </>
                  )}
                </td>

              </tr>
            ))}
          </tbody>

        </table>

      </div>

    </div>
  )
}

export default ManagerDashboard