const express = require("express");
const protect = require("../middlewares/authMiddleware");
const {
  createTask,
  getProjectTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  retryTask,
  deleteTask,
  getTaskHistory,
} = require("../controllers/taskController");

const router = express.Router();

router.post("/projects/:projectId/tasks", protect, createTask);
router.get("/projects/:projectId/tasks", protect, getProjectTasks);
router.get("/tasks/:taskId", protect, getTaskById);
router.put("/tasks/:taskId", protect, updateTask);
router.patch("/tasks/:taskId/status", protect, updateTaskStatus);
router.patch("/tasks/:taskId/retry", protect, retryTask);
router.delete("/tasks/:taskId", protect, deleteTask);
router.get("/tasks/:taskId/history", protect, getTaskHistory);

module.exports = router;
