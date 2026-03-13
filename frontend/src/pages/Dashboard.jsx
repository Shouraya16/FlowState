import ClientDashboard from "./ClientDashboard"
import AdminDashboard from "./AdminDashboard"
import EmployeeDashboard from "./EmployeeDashboard"

function Dashboard(){

const role = localStorage.getItem("role")

if(role==="CLIENT") return <ClientDashboard/>
if(role==="ADMIN") return <AdminDashboard/>
if(role==="EMPLOYEE") return <EmployeeDashboard/>

return <h2>No Access</h2>

}

export default Dashboard