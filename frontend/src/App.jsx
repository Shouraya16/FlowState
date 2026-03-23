import { Routes, Route } from "react-router-dom"

import Home from "./pages/Home"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import Dashboard from "./pages/Dashboard"
import FeatureRequest from "./pages/FeatureRequest"
import PrivateRoute from "./components/PrivateRoute"
import Navbar from "./components/Navbar"

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/feature"
          element={
            <PrivateRoute>
              <FeatureRequest />
            </PrivateRoute>
          }
        />
      </Routes>
    </>
  )
}

export default App