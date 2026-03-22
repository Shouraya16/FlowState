import { useNavigate } from "react-router-dom"

function Home(){

const navigate = useNavigate()

return(

<div className="landing">

<div className="hero">

<h1>FlowState</h1>

<p>

Transform feature ideas into structured development workflows.

Clients submit requests → Managers organize tasks →  
Developers build → Testers validate → Products ship.

</p>

<div className="hero-buttons">

<button className="primary" onClick={()=>navigate("/login")}>
Login
</button>

<button className="secondary" onClick={()=>navigate("/signup")}>
Get Started
</button>

</div>

</div>

<div className="features">

<div className="feature-card">
<h3>📩 Feature Requests</h3>
<p>Clients easily submit product ideas and improvements.</p>
</div>

<div className="feature-card">
<h3>⚙️ Task Management</h3>
<p>Managers convert requests into structured development tasks.</p>
</div>

<div className="feature-card">
<h3>💻 Developer Workflow</h3>
<p>Developers receive tasks and track implementation progress.</p>
</div>

<div className="feature-card">
<h3>🧪 QA Validation</h3>
<p>Testers verify features before final deployment.</p>
</div>

</div>

</div>

)

}

export default Home