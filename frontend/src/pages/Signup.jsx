import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Signup() {

  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");

  const navigate = useNavigate();

  const handleSignup = async (e) => {

    e.preventDefault();

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
      alert(data.error);
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
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
        />

        <button type="submit">Signup</button>

      </form>

    </div>

  );
}

export default Signup;