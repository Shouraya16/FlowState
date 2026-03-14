import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Signup() {

  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [role, setRole] = useState("");
  
  const navigate = useNavigate();

  const handleSignup = async (e) => {

    e.preventDefault();

    if (!role) {
      alert("Please select a role.");
      return;
    }
    
    const res = await fetch("http://localhost:5000/signup",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body: JSON.stringify({email,password})
    });

    const data = await res.json();

    if(res.ok){
      alert("Account created!");
      navigate("/login");
    } else {
      alert(data.error || "Signup failed.");
    }

  };

  return (

    <div className="container">

      <h2>Signup</h2>

      <form onSubmit={handleSignup}>

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

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          required
        >
          <option value="" disabled>Select your role</option>
          <option value="CLIENT">Client</option>
          <option value="MANAGER">Manager</option>
          <option value="DEVELOPER">Developer</option>
          <option value="TESTER">Tester</option>
          <option value="DESIGNER">Designer</option>
          <option value="ADMIN">Admin</option>
        </select>

        <button type="submit">Signup</button>

      </form>

    </div>

  );
}

export default Signup;

export default Signup;
