import { Link, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"

function Navbar(){

const navigate = useNavigate()
const [role,setRole] = useState(null)

useEffect(()=>{

const token = localStorage.getItem("token")
const userRole = localStorage.getItem("role")

if(token){
setRole(userRole)
}

},[])

const handleLogout = () => {

localStorage.removeItem("token")
localStorage.removeItem("role")

navigate("/")
window.location.reload()

}

return(

<nav className="navbar">

<h2>FlowState</h2>

<div>

{!role && (
<>
<Link to="/">Home</Link>
<Link to="/login">Login</Link>
<Link to="/signup">Signup</Link>
</>
)}

{role && (
<>
<Link to="/dashboard">Dashboard</Link>

{role==="CLIENT" && (
<Link to="/feature">Submit Request</Link>
)}

<button onClick={handleLogout}>Logout</button>
</>
)}

</div>

</nav>

)

}

export default Navbar