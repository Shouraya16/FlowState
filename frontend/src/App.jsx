import { Routes, Route } from "react-router-dom"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import FeatureRequest from "./pages/FeatureRequest"
import Navbar from "./components/Navbar"

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/feature-request" element={<FeatureRequest />} />
      </Routes>
    </>
  )
}

export default App
