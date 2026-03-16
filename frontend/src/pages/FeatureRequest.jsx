import { useState } from "react"

function FeatureRequest(){

const [title,setTitle] = useState("")
const [description,setDescription] = useState("")

const handleSubmit = async(e)=>{

e.preventDefault()

const token = localStorage.getItem("token")

const res = await fetch("http://localhost:8000/requests",{

method:"POST",

headers:{
"Content-Type":"application/json",
"Authorization":"Bearer "+token
},

body:JSON.stringify({
title,
description
})

})

if(res.ok){

alert("Feature request submitted!")

setTitle("")
setDescription("")

}else{

alert("Failed")

}

}

return(

<div className="container">

<h2>Submit Feature Request</h2>

<form onSubmit={handleSubmit}>

<input
type="text"
placeholder="Title"
value={title}
onChange={(e)=>setTitle(e.target.value)}
required
/>

<textarea
placeholder="Describe feature..."
value={description}
onChange={(e)=>setDescription(e.target.value)}
required
/>

<button type="submit">Submit</button>

</form>

</div>

)

}

export default FeatureRequest