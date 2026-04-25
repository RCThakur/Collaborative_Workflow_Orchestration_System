const express = require("express");
const protect = require("../middlewares/authMiddleware");
const {
  createProject,
  getMyProjects,
  generateInvite,
  joinProject,
} = require("../controllers/projectController");

const router = express.Router();

router.post("/", protect, createProject);
router.get("/", protect, getMyProjects);
router.post("/:projectId/invite", protect, generateInvite);
router.post("/join", protect, joinProject);

module.exports = router;
