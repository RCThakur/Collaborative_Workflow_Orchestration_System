const Task = require("../models/Task");

const validateDependencies = async ({
  projectId,
  taskId = null,
  dependencies = [],
}) => {
  if (!Array.isArray(dependencies)) {
    return { valid: false, message: "Dependencies must be an array" };
  }

  const uniqueDependencies = [...new Set(dependencies.map(String))];

  if (taskId && uniqueDependencies.includes(taskId.toString())) {
    return { valid: false, message: "Task cannot depend on itself" };
  }

  const dependencyTasks = await Task.find({
    _id: { $in: uniqueDependencies },
  });

  if (dependencyTasks.length !== uniqueDependencies.length) {
    return {
      valid: false,
      message: "One or more dependency tasks do not exist",
    };
  }

  const invalidProjectDependency = dependencyTasks.some(
    (task) => task.project.toString() !== projectId.toString(),
  );

  if (invalidProjectDependency) {
    return {
      valid: false,
      message: "All dependencies must belong to the same project",
    };
  }

  const allTasks = await Task.find({ project: projectId }).select(
    "_id dependencies",
  );

  const graph = new Map();

  for (const task of allTasks) {
    graph.set(task._id.toString(), task.dependencies.map(String));
  }

  if (taskId) {
    graph.set(taskId.toString(), uniqueDependencies);
  }

  const visited = new Set();
  const recStack = new Set();

  const hasCycle = (node) => {
    if (recStack.has(node)) return true;
    if (visited.has(node)) return false;

    visited.add(node);
    recStack.add(node);

    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (hasCycle(neighbor)) return true;
    }

    recStack.delete(node);
    return false;
  };

  for (const node of graph.keys()) {
    if (hasCycle(node)) {
      return { valid: false, message: "Cyclic dependency detected" };
    }
  }

  return { valid: true };
};

const getBlockedReason = async (task) => {
  if (!task.dependencies || task.dependencies.length === 0) return null;

  const dependencyTasks = await Task.find({
    _id: { $in: task.dependencies },
  });

  const failedDependency = dependencyTasks.find(
    (dep) => dep.status === "Failed" || dep.status === "Blocked",
  );

  if (failedDependency) {
    return "Task is blocked because one or more dependencies failed or are blocked";
  }

  const incompleteDependency = dependencyTasks.find(
    (dep) => dep.status !== "Completed",
  );

  if (incompleteDependency) {
    return "Task is blocked because dependencies are not completed";
  }

  return null;
};

module.exports = {
  validateDependencies,
  getBlockedReason,
};
