import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const DashboardPage = () => {
  const { user, logout } = useAuth();

  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectError, setProjectError] = useState("");

  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
  });
  const [creatingProject, setCreatingProject] = useState(false);
  const [createMessage, setCreateMessage] = useState("");
  const [createError, setCreateError] = useState("");

  const [joinToken, setJoinToken] = useState("");
  const [joiningProject, setJoiningProject] = useState(false);
  const [joinMessage, setJoinMessage] = useState("");
  const [joinError, setJoinError] = useState("");

  const [inviteLoadingId, setInviteLoadingId] = useState("");
  const [inviteMap, setInviteMap] = useState({});
  const [inviteError, setInviteError] = useState("");

  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);
      setProjectError("");
      const response = await api.get("/projects");
      setProjects(response.data.projects || response.data || []);
    } catch (error) {
      setProjectError(
        error.response?.data?.message || "Failed to load projects",
      );
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateChange = (e) => {
    setCreateForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setCreateMessage("");
    setCreateError("");
    setCreatingProject(true);

    try {
      const response = await api.post("/projects", createForm);
      setCreateMessage(response.data.message || "Project created successfully");
      setCreateForm({ name: "", description: "" });
      fetchProjects();
    } catch (error) {
      setCreateError(
        error.response?.data?.message || "Failed to create project",
      );
    } finally {
      setCreatingProject(false);
    }
  };

  const handleJoinProject = async (e) => {
    e.preventDefault();
    setJoinMessage("");
    setJoinError("");
    setJoiningProject(true);

    try {
      const response = await api.post("/projects/join", {
        token: joinToken,
      });
      setJoinMessage(response.data.message || "Joined project successfully");
      setJoinToken("");
      fetchProjects();
    } catch (error) {
      setJoinError(error.response?.data?.message || "Failed to join project");
    } finally {
      setJoiningProject(false);
    }
  };

  const handleGenerateInvite = async (projectId) => {
    try {
      setInviteError("");
      setInviteLoadingId(projectId);

      const response = await api.post(`/projects/${projectId}/invite`);
      console.log("Invite response:", response.data);

      const inviteLink = response.data.inviteLink || response.data.link || "";

      const token =
        response.data.token ||
        response.data.inviteToken ||
        (inviteLink
          ? inviteLink.substring(inviteLink.lastIndexOf("/") + 1)
          : "");

      setInviteMap((prev) => ({
        ...prev,
        [projectId]: {
          token,
          inviteLink,
        },
      }));
    } catch (error) {
      setInviteError(
        error.response?.data?.message || "Failed to generate invite",
      );
    } finally {
      setInviteLoadingId("");
    }
  };

  const handleCopy = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      alert("Copied to clipboard");
    } catch (error) {
      alert("Copy failed");
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-layout">
        <div className="dashboard-header">
          <div>
            <h1>Project Dashboard</h1>
            <p>
              Welcome, <strong>{user?.name}</strong> ({user?.email})
            </p>
          </div>
          <button onClick={logout} className="logout-btn">
            Logout
          </button>
        </div>

        <div className="dashboard-grid">
          <div className="panel">
            <h2>Create Project</h2>
            <p>Create a new collaborative workflow project.</p>

            {createMessage && (
              <div className="success-box">{createMessage}</div>
            )}
            {createError && <div className="error-box">{createError}</div>}

            <form onSubmit={handleCreateProject} className="auth-form">
              <div>
                <label>Project Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter project name"
                  value={createForm.name}
                  onChange={handleCreateChange}
                  required
                />
              </div>

              <div>
                <label>Description</label>
                <input
                  type="text"
                  name="description"
                  placeholder="Enter project description"
                  value={createForm.description}
                  onChange={handleCreateChange}
                />
              </div>

              <button type="submit" disabled={creatingProject}>
                {creatingProject ? "Creating..." : "Create Project"}
              </button>
            </form>
          </div>

          <div className="panel">
            <h2>Join Project</h2>
            <p>Join an existing project using an invite token.</p>

            {joinMessage && <div className="success-box">{joinMessage}</div>}
            {joinError && <div className="error-box">{joinError}</div>}

            <form onSubmit={handleJoinProject} className="auth-form">
              <div>
                <label>Invite Token</label>
                <input
                  type="text"
                  placeholder="Paste invite token"
                  value={joinToken}
                  onChange={(e) => setJoinToken(e.target.value)}
                  required
                />
              </div>

              <button type="submit" disabled={joiningProject}>
                {joiningProject ? "Joining..." : "Join Project"}
              </button>
            </form>
          </div>
        </div>

        <div className="panel project-list-panel">
          <div className="project-list-header">
            <div>
              <h2>Your Projects</h2>
              <p>All projects where you are a member.</p>
            </div>
            <button onClick={fetchProjects}>Refresh</button>
          </div>

          {inviteError && <div className="error-box">{inviteError}</div>}
          {projectError && <div className="error-box">{projectError}</div>}

          {loadingProjects ? (
            <div className="empty-state">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="empty-state">No projects found.</div>
          ) : (
            <div className="project-list">
              {projects.map((project) => (
                <div key={project._id} className="project-card">
                  <div className="project-card-top">
                    <div>
                      <h3>{project.name}</h3>
                      <p>{project.description || "No description provided"}</p>
                    </div>
                  </div>

                  <div className="project-meta">
                    <span>Members: {project.members?.length || 0}</span>
                    <span>
                      Created:{" "}
                      {project.createdAt
                        ? new Date(project.createdAt).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>

                  <div className="project-actions">
                    <button
                      onClick={() => handleGenerateInvite(project._id)}
                      disabled={inviteLoadingId === project._id}
                    >
                      {inviteLoadingId === project._id
                        ? "Generating..."
                        : "Generate Invite"}
                    </button>
                  </div>

                  {inviteMap[project._id] && (
                    <div className="invite-box">
                      <label>Invite Token</label>
                      <div className="copy-row">
                        <input
                          type="text"
                          value={inviteMap[project._id].token || ""}
                          readOnly
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(inviteMap[project._id].token || "")
                          }
                        >
                          Copy
                        </button>
                      </div>

                      {inviteMap[project._id].inviteLink && (
                        <>
                          <label>Invite Link</label>
                          <div className="copy-row">
                            <input
                              type="text"
                              value={inviteMap[project._id].inviteLink}
                              readOnly
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(
                                  inviteMap[project._id].inviteLink || "",
                                )
                              }
                            >
                              Copy
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
