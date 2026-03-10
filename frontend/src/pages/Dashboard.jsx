import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if(!token){
      navigate("/login");
    }

  }, []);

  return (

    <div className="container">

      <h2>Dashboard</h2>

      <p>Welcome to FlowState dashboard.</p>

    </div>

  );
}

export default Dashboard;