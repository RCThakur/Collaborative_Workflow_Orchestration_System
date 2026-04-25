import { useAuth } from "../context/AuthContext";

const DashboardPage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <div className="dashboard-topbar">
          <div>
            <h1>Dashboard</h1>
            <p>Welcome, {user?.name || "User"}</p>
          </div>
          <button onClick={logout}>Logout</button>
        </div>

        <div className="dashboard-content">
          <div className="info-box">
            <h3>User Info</h3>
            <p>
              <strong>Name:</strong> {user?.name}
            </p>
            <p>
              <strong>Email:</strong> {user?.email}
            </p>
          </div>

          <div className="info-box">
            <h3>Next Step</h3>
            <p>
              In the next client step, we will build the real project dashboard
              and project list UI.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
