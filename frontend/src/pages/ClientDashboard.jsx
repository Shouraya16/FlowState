import { Link } from "react-router-dom"

function ClientDashboard(){

return(

<div className="container">

<h2>Client Dashboard</h2>

<p>Submit new feature requests and track their progress.</p>

<Link to="/feature">
<button>Submit Feature Request</button>
</Link>

</div>

)

}

export default ClientDashboard