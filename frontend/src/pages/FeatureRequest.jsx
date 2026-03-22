import { useState } from "react"

function FeatureRequest(){

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()

    const token = localStorage.getItem("token")   // 🔥 get token

    try {

      const res = await fetch("http://localhost:8000/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",

          // 🔥 THIS IS THE IMPORTANT LINE
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title,
          description: description
        })
      })

      const data = await res.json()

      if(res.ok){
        alert("Request submitted ✅")
        setTitle("")
        setDescription("")
      } else {
        alert(data.detail || "Error submitting request ❌")
      }

    } catch(err){
      console.log(err)
      alert("Server error")
    }
  }

  return (

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
          placeholder="Description"
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