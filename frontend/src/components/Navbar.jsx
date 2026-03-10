import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

function Navbar() {

  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setLoggedIn(false);
    navigate("/");
  };

  return (
    <nav className="navbar">

      <h3>FlowState</h3>

      <div>

        {!loggedIn && (
          <>
            <Link to="/">Home</Link>
            <Link to="/login">Login</Link>
            <Link to="/signup">Signup</Link>
          </>
        )}

        {loggedIn && (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/feature">Feature Request</Link>
            <button onClick={handleLogout}>Logout</button>
          </>
        )}

      </div>

    </nav>
  );
}

export default Navbar;