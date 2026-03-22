import { useState } from "react"
import { useNavigate } from "react-router-dom"

function Login(){

const navigate = useNavigate()

const [email,setEmail] = useState("")
const [password,setPassword] = useState("")

const handleLogin = async(e)=>{

e.preventDefault()

const res = await fetch("http://localhost:8000/auth/login",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
email,
password
})

})

const data = await res.json()

if(res.ok){

localStorage.setItem("token",data.token)
localStorage.setItem("role",data.role)

navigate("/dashboard")
window.location.reload()

}else{

alert(data.detail || "Login failed")

}

}

return(

<div className="container">

<h2>Login</h2>

<form onSubmit={handleLogin}>

<input
type="email"
placeholder="Email"
value={email}
onChange={(e)=>setEmail(e.target.value)}
required
/>

<input
type="password"
placeholder="Password"
value={password}
onChange={(e)=>setPassword(e.target.value)}
required
/>

<button type="submit">Login</button>

</form>

</div>

)

}

export default Login