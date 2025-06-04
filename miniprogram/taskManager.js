// Task Manager Module
const taskStorage = require('./taskStorage');

/**
 * Add a new task with a unique ID
 * @param {Object} task - Task object to add
 * @returns {Object} The added task with ID
 */
function addTask(task) {
  const tasks = taskStorage.loadTasks() || [];
  const newTask = {
    id: Date.now().toString(), // Ensure unique ID
    ...task,
    createdAt: new Date().toISOString(),
    creatorId: wx.getStorageSync('userInfo') ? wx.getStorageSync('userInfo').openId : undefined,
    isShared: false,
    sharedWith: [],
    allCompleted: false
  };
  tasks.push(newTask);
  taskStorage.saveTasks(tasks);
  return newTask;
}

/**
 * Delete a task by ID
 * @param {String} taskId - ID of task to delete
 * @returns {Array} Updated tasks array
 */
function deleteTask(taskId) {
  const tasks = taskStorage.loadTasks() || [];
  const task = tasks.find(t => t.id === taskId);
  
  // Cannot delete shared tasks that have been accepted
  if (task && task.isShared && task.sharedWith && task.sharedWith.some(user => user.accepted)) {
    throw new Error('Cannot delete a shared task that has been accepted');
  }
  
  const previousLength = tasks.length;
  const updatedTasks = tasks.filter(task => task.id !== taskId);
  
  // Only save if a task was actually deleted
  if (updatedTasks.length !== previousLength) {
    taskStorage.saveTasks(updatedTasks);
  }
  
  return updatedTasks;
}

/**
 * Get all tasks
 * @returns {Array} All tasks
 */
function getTasks() {
  return taskStorage.loadTasks() || [];
}

/**
 * Update task status
 * @param {String} taskId - ID of task to update
 * @param {Boolean} isDone - New done status
 * @returns {Array} Updated tasks array
 */
function updateTaskStatus(taskId, isDone) {
  const tasks = taskStorage.loadTasks() || [];
  const task = tasks.find(t => t.id === taskId);
  
  if (!task) return tasks;
  
  const currentUser = wx.getStorageSync('userInfo');
  const currentUserId = currentUser ? currentUser.openId : null;
  
  // Initialize completionStatus if it doesn't exist
  if (!task.completionStatus) {
    task.completionStatus = {};
  }
  
  // Update the current user's completion status
  task.completionStatus[currentUserId] = isDone;
  
  // Handle shared vs non-shared tasks differently
  if (task.isShared && task.sharedWith && task.sharedWith.length > 0) {
    // For shared tasks: Check if all participants completed it
    const allParticipants = [task.creatorId, ...task.sharedWith.map(user => user.openId)];
    const allCompleted = allParticipants.every(participantId => 
      task.completionStatus[participantId] === true
    );
    
    // Only mark as fully done if all participants completed it
    task.isDone = allCompleted;
    
    // Change task color to grey if current user completed it but not everyone has
    task.isGreyedOut = task.completionStatus[currentUserId] === true && !allCompleted;
    
    if (allCompleted) {
      task.completedDate = new Date().toISOString().split('T')[0];
    } else {
      task.completedDate = undefined;
    }
  } else {
    // For non-shared tasks: Simply mark as done based on current user action
    task.isDone = isDone;
    task.isGreyedOut = false; // Non-shared tasks don't need grey state
    
    if (isDone) {
      task.completedDate = new Date().toISOString().split('T')[0];
    } else {
      task.completedDate = undefined;
    }
  }
  
  taskStorage.saveTasks(tasks);
  return tasks;
}

/**
 * Share a task with WeChat friends
 * @param {String} taskId - ID of task to share
 * @param {Array} friendList - List of friend objects with openId, nickname and avatarUrl
 * @returns {Object} Updated task
 */
function shareTask(taskId, friendList) {
  if (!Array.isArray(friendList) || friendList.length === 0) {
    throw new Error('Friend list cannot be empty');
  }
  
  if (friendList.length > 3) {
    throw new Error('Cannot share with more than 3 friends');
  }
  
  const tasks = taskStorage.loadTasks() || [];
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  
  if (taskIndex === -1) {
    throw new Error('Task not found');
  }
  
  const task = tasks[taskIndex];
  
  // Check if the task is already shared and has accepted participants
  if (task.isShared && task.sharedWith && task.sharedWith.some(user => user.accepted)) {
    throw new Error('Cannot modify a shared task that has been accepted');
  }
  
  // Convert friends to shared users
  const sharedUsers = friendList.map(friend => ({
    openId: friend.openId,
    nickname: friend.nickname,
    avatarUrl: friend.avatarUrl,
    accepted: false,
    completedTask: false
  }));
  
  // Update the task
  tasks[taskIndex] = {
    ...task,
    isShared: true,
    sharedWith: sharedUsers,
    allCompleted: false
  };
  
  taskStorage.saveTasks(tasks);
  
  // Send sharing invitations (mock implementation)
  // In a real app, this would call WeChat API to send messages
  console.log(`Sharing task ${taskId} with ${sharedUsers.length} friends`);
  
  return tasks[taskIndex];
}

/**
 * Accept a shared task invitation
 * @param {String} taskId - ID of task 
 * @param {String} userId - User ID accepting the invitation
 * @returns {Object} Updated task
 */
function acceptSharedTask(taskId, userId) {
  const tasks = taskStorage.loadTasks() || [];
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  
  if (taskIndex === -1) {
    throw new Error('Task not found');
  }
  
  const task = tasks[taskIndex];
  
  if (!task.isShared || !task.sharedWith || task.sharedWith.length === 0) {
    throw new Error('This task is not shared');
  }
  
  const userIndex = task.sharedWith.findIndex(user => user.openId === userId);
  
  if (userIndex === -1) {
    throw new Error('User is not invited to this task');
  }
  
  // Update user acceptance
  task.sharedWith[userIndex].accepted = true;
  
  taskStorage.saveTasks(tasks);
  return task;
}

module.exports = {
  addTask,
  deleteTask,
  getTasks,
  updateTaskStatus,
  shareTask,
  acceptSharedTask
};
