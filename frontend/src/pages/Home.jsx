import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="container">
      <h1>FlowState</h1>

      <p>
        FlowState is a workflow management platform that helps teams convert
        feature requests into structured development tasks while managing
        approvals, assignments, and notifications efficiently.
      </p>

      <div className="buttons">
        <Link to="/login">
          <button>Login</button>
        </Link>

        <Link to="/signup">
          <button>Sign Up</button>
        </Link>
      </div>
    </div>
  );
}

export default Home;