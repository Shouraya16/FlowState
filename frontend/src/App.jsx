import { Routes, Route } from "react-router-dom"

import Home from "./pages/Home"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import Dashboard from "./pages/Dashboard"
import FeatureRequest from "./pages/FeatureRequest"

function App(){

return(

<Routes>

<Route path="/" element={<Home/>}/>
<Route path="/login" element={<Login/>}/>
<Route path="/signup" element={<Signup/>}/>
<Route path="/dashboard" element={<Dashboard/>}/>
<Route path="/feature" element={<FeatureRequest/>}/>

</Routes>

)

}

export default App