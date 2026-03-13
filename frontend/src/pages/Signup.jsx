import { useState } from "react"
import { useNavigate } from "react-router-dom"

function Signup(){

const navigate = useNavigate()

const [email,setEmail] = useState("")
const [password,setPassword] = useState("")
const [role,setRole] = useState("CLIENT")

const handleSignup = async(e)=>{

e.preventDefault()

const res = await fetch("http://localhost:8000/auth/signup",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
email,
password,
user_type:role
})

})

const data = await res.json()

if(res.ok){

alert("Account created")

navigate("/login")

}else{

alert(data.detail || "Signup failed")

}

}

return(

<div className="container">

<h2>Signup</h2>

<form onSubmit={handleSignup}>

<input
type="email"
placeholder="Email"
value={email}
onChange={(e)=>setEmail(e.target.value)}
/>

<input
type="password"
placeholder="Password"
value={password}
onChange={(e)=>setPassword(e.target.value)}
/>

<select
value={role}
onChange={(e)=>setRole(e.target.value)}
>

<option value="CLIENT">Client</option>
<option value="ADMIN">Admin</option>
<option value="EMPLOYEE">Employee</option>

</select>

<button type="submit">Signup</button>

</form>

</div>

)

}

export default Signup