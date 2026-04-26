const Project = require("../models/Project");
const Task = require("../models/Task");
const TaskVersion = require("../models/TaskVersion");
const {
  validateDependencies,
  getBlockedReason,
} = require("../utils/taskValidation");

const isProjectMember = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) return { ok: false, status: 404, message: "Project not found" };

  const member = project.members.some(
    (memberId) => memberId.toString() === userId,
  );

  if (!member) {
    return {
      ok: false,
      status: 403,
      message: "Access denied. Not a project member",
    };
  }

  return { ok: true, project };
};

const createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      title,
      description,
      priority,
      estimatedHours,
      status,
      dependencies,
      resourceTag,
      maxRetries,
    } = req.body;

    const access = await isProjectMember(projectId, req.user.userId);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Task title is required" });
    }

    const dependencyValidation = await validateDependencies({
      projectId,
      dependencies: dependencies || [],
    });

    if (!dependencyValidation.valid) {
      return res.status(400).json({ message: dependencyValidation.message });
    }

    const task = await Task.create({
      project: projectId,
      title: title.trim(),
      description: description?.trim() || "",
      priority,
      estimatedHours,
      status: status || "Pending",
      dependencies: dependencies || [],
      resourceTag: resourceTag?.trim() || "",
      maxRetries: maxRetries ?? 0,
      createdBy: req.user.userId,
      versionNumber: 1,
    });

    const blockedReason = await getBlockedReason(task);
    if (blockedReason) {
      task.status = "Blocked";
      await task.save();
    }

    await TaskVersion.create({
      taskId: task._id,
      project: task.project,
      versionNumber: task.versionNumber,
      snapshot: task.toObject(),
      changedBy: req.user.userId,
    });

    res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create task",
      error: error.message,
    });
  }
};

const getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;

    const access = await isProjectMember(projectId, req.user.userId);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const tasks = await Task.find({ project: projectId })
      .populate("dependencies", "title status")
      .sort({ createdAt: -1 });

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch tasks",
      error: error.message,
    });
  }
};

const getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId).populate(
      "dependencies",
      "title status",
    );
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const access = await isProjectMember(task.project, req.user.userId);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch task",
      error: error.message,
    });
  }
};

const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const {
      title,
      description,
      priority,
      estimatedHours,
      status,
      dependencies,
      resourceTag,
      maxRetries,
      versionNumber,
    } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const access = await isProjectMember(task.project, req.user.userId);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    if (versionNumber !== task.versionNumber) {
      return res.status(409).json({
        message: "Version mismatch. Task has been updated by another user.",
        latestTask: task,
      });
    }

    const nextDependencies = dependencies ?? task.dependencies;

    const dependencyValidation = await validateDependencies({
      projectId: task.project,
      taskId: task._id,
      dependencies: nextDependencies,
    });

    if (!dependencyValidation.valid) {
      return res.status(400).json({ message: dependencyValidation.message });
    }

    task.title = title ?? task.title;
    task.description = description ?? task.description;
    task.priority = priority ?? task.priority;
    task.estimatedHours = estimatedHours ?? task.estimatedHours;
    task.status = status ?? task.status;
    task.dependencies = nextDependencies;
    task.resourceTag = resourceTag ?? task.resourceTag;
    task.maxRetries = maxRetries ?? task.maxRetries;
    task.versionNumber += 1;

    const blockedReason = await getBlockedReason(task);
    if (blockedReason && task.status !== "Completed") {
      task.status = "Blocked";
    } else if (!blockedReason && task.status === "Blocked") {
      task.status = "Pending";
    }

    await task.save();

    await TaskVersion.create({
      taskId: task._id,
      project: task.project,
      versionNumber: task.versionNumber,
      snapshot: task.toObject(),
      changedBy: req.user.userId,
    });

    res.status(200).json({
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update task",
      error: error.message,
    });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, versionNumber } = req.body;

    const task = await Task.findById(taskId).populate("dependencies");
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const access = await isProjectMember(task.project, req.user.userId);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    if (versionNumber !== task.versionNumber) {
      return res.status(409).json({
        message: "Version mismatch. Task has been updated by another user.",
        latestTask: task,
      });
    }

    const blockedReason = await getBlockedReason(task);

    if (status === "Running") {
      if (blockedReason) {
        return res.status(400).json({
          message: blockedReason,
        });
      }

      if (task.resourceTag) {
        const conflictingTask = await Task.findOne({
          _id: { $ne: task._id },
          project: task.project,
          status: "Running",
          resourceTag: task.resourceTag,
        });

        if (conflictingTask) {
          return res.status(400).json({
            message: "Another running task already uses the same resourceTag",
          });
        }
      }
    }

    if (status === "Failed") {
      if (task.retryCount >= task.maxRetries) {
        return res.status(400).json({
          message: "Retry limit reached for this task",
        });
      }
    }

    if (status === "Completed" && blockedReason) {
      return res.status(400).json({
        message: "Blocked task cannot be completed",
      });
    }

    task.status = status;
    task.versionNumber += 1;

    await task.save();

    await TaskVersion.create({
      taskId: task._id,
      project: task.project,
      versionNumber: task.versionNumber,
      snapshot: task.toObject(),
      changedBy: req.user.userId,
    });

    res.status(200).json({
      message: "Task status updated successfully",
      task,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update task status",
      error: error.message,
    });
  }
};

const retryTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { versionNumber } = req.body;

    const task = await Task.findById(taskId).populate("dependencies");
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const access = await isProjectMember(task.project, req.user.userId);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    if (versionNumber !== task.versionNumber) {
      return res.status(409).json({
        message: "Version mismatch. Task has been updated by another user.",
        latestTask: task,
      });
    }

    if (task.status !== "Failed") {
      return res.status(400).json({
        message: "Only failed tasks can be retried",
      });
    }

    if (task.retryCount >= task.maxRetries) {
      return res.status(400).json({
        message: "Retry limit reached for this task",
      });
    }

    const blockedReason = await getBlockedReason(task);
    if (blockedReason) {
      return res.status(400).json({
        message: blockedReason,
      });
    }

    task.retryCount += 1;
    task.status = "Pending";
    task.versionNumber += 1;

    await task.save();

    await TaskVersion.create({
      taskId: task._id,
      project: task.project,
      versionNumber: task.versionNumber,
      snapshot: task.toObject(),
      changedBy: req.user.userId,
    });

    res.status(200).json({
      message: "Task retry attempted successfully",
      task,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retry task",
      error: error.message,
    });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const access = await isProjectMember(task.project, req.user.userId);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const dependentTask = await Task.findOne({
      project: task.project,
      dependencies: task._id,
    });

    if (dependentTask) {
      return res.status(400).json({
        message: "Cannot delete task because other tasks depend on it",
      });
    }

    await TaskVersion.create({
      taskId: task._id,
      project: task.project,
      versionNumber: task.versionNumber,
      snapshot: task.toObject(),
      changedBy: req.user.userId,
    });

    await task.deleteOne();

    res.status(200).json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete task",
      error: error.message,
    });
  }
};

const getTaskHistory = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const access = await isProjectMember(task.project, req.user.userId);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const history = await TaskVersion.find({ taskId })
      .populate("changedBy", "name email")
      .sort({ versionNumber: 1 });

    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch task history",
      error: error.message,
    });
  }
};

module.exports = {
  createTask,
  getProjectTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  retryTask,
  deleteTask,
  getTaskHistory,
};
