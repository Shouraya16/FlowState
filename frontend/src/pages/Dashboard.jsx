function Dashboard() {
  const user = localStorage.getItem("user")

  return (
    <div className="container">
      <h2>Welcome, {user}</h2>
      <p>You can submit new feature requests from the menu.</p>
    </div>
  )
}

export default Dashboard
