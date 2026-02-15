import { Link } from "react-router-dom"

function Navbar() {
  return (
    <nav className="navbar">
      <h2>FlowState</h2>
      <div>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/feature-request">New Request</Link>
      </div>
    </nav>
  )
}

export default Navbar
