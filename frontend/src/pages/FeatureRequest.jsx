import { useState } from "react"

function FeatureRequest() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()

    const request = {
      title,
      description,
      status: "PENDING"
    }

    console.log("Feature Request Submitted:", request)
    alert("Feature Request Submitted!")

    setTitle("")
    setDescription("")
  }

  return (
    <div className="container">
      <h2>Submit Feature Request</h2>
      <form onSubmit={handleSubmit}>
        <input 
          type="text"
          placeholder="Feature Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea 
          placeholder="Describe your feature..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button type="submit">Submit</button>
      </form>
    </div>
  )
}

export default FeatureRequest
