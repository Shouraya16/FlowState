import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Signup() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("");
  const [employeeType, setEmployeeType] = useState("");

  const handleSignup = async (e) => {

    e.preventDefault();

    const payload = {
      email,
      password,
      user_type: userType,
      employee_type: userType === "EMPLOYEE" ? employeeType : null
    };

    try {

      const res = await fetch("http://localhost:8000/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || "Signup failed");
        return;
      }

      alert("Account created successfully!");
      navigate("/login");

    } catch (error) {
      alert("Server error. Try again.");
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
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <select
          value={userType}
          onChange={(e) => setUserType(e.target.value)}
          required
        >
          <option value="">Select User Type</option>
          <option value="CLIENT">Client</option>
          <option value="ADMIN">Admin</option>
          <option value="EMPLOYEE">Employee</option>
        </select>

        {userType === "EMPLOYEE" && (
          <select
            value={employeeType}
            onChange={(e) => setEmployeeType(e.target.value)}
            required
          >
            <option value="">Select Employee Role</option>
            <option value="MANAGER">Manager</option>
            <option value="DEVELOPER">Developer</option>
            <option value="TESTER">Tester</option>
            <option value="DESIGNER">Designer</option>
          </select>
        )}

        <button type="submit">Signup</button>

      </form>

    </div>

  );

}

export default Signup;