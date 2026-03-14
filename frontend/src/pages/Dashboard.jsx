import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import ClientDashboard from "./ClientDashboard";
import ManagerDashboard from "./ManagerDashboard";
import DeveloperDashboard from "./DeveloperDashboard";
import TesterDashboard from "./TesterDashboard";
import DesignerDashboard from "./DesignerDashboard";
import AdminDashboard from "./AdminDashboard";

function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, []);

  if (!token) return null;

  switch (role) {
    case "CLIENT":
      return <ClientDashboard />;
    case "MANAGER":
      return <ManagerDashboard />;
    case "DEVELOPER":
      return <DeveloperDashboard />;
    case "TESTER":
      return <TesterDashboard />;
    case "DESIGNER":
      return <DesignerDashboard />;
    case "ADMIN":
      return <AdminDashboard />;
    default:
      return (
        <div className="container">
          <h2>Unknown Role</h2>
          <p>Your account role is not recognized. Please contact admin.</p>
        </div>
      );
  }
}

export default Dashboard;
