const jwt = require("jsonwebtoken");
const Project = require("../models/Project");

const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Project name is required" });
    }

    const project = await Project.create({
      name: name.trim(),
      description: description?.trim() || "",
      owner: req.user.userId,
      members: [req.user.userId],
    });

    res.status(201).json({
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create project",
      error: error.message,
    });
  }
};

const getMyProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      members: req.user.userId,
    })
      .populate("owner", "name email")
      .populate("members", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch projects",
      error: error.message,
    });
  }
};

const generateInvite = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const isMember = project.members.some(
      (memberId) => memberId.toString() === req.user.userId,
    );

    if (!isMember) {
      return res.status(403).json({
        message: "Access denied. Not a project member",
      });
    }

    const inviteToken = jwt.sign(
      { projectId },
      process.env.INVITE_TOKEN_SECRET,
      { expiresIn: "30m" },
    );

    const inviteLink = `${process.env.CLIENT_URL}/join/${inviteToken}`;

    res.status(200).json({
      message: "Invite generated successfully",
      token: inviteToken,
      inviteLink,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to generate invite",
      error: error.message,
    });
  }
};

const joinProject = async (req, res) => {
  try {
    const { inviteToken } = req.body;

    if (!inviteToken) {
      return res.status(400).json({ message: "Invite token is required" });
    }

    const decoded = jwt.verify(inviteToken, process.env.INVITE_TOKEN_SECRET);

    const project = await Project.findById(decoded.projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const alreadyMember = project.members.some(
      (memberId) => memberId.toString() === req.user.userId,
    );

    if (alreadyMember) {
      return res.status(200).json({
        message: "User is already a member of this project",
        project,
      });
    }

    project.members.push(req.user.userId);
    await project.save();

    res.status(200).json({
      message: "Joined project successfully",
      project,
    });
  } catch (error) {
    res.status(400).json({
      message: "Invalid or expired invite token",
      error: error.message,
    });
  }
};

module.exports = {
  createProject,
  getMyProjects,
  generateInvite,
  joinProject,
};
