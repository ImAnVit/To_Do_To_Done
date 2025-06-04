// Task Storage Module
const TASKS_KEY = 'tasks';

/**
 * Save tasks to storage
 * @param {Array} tasks - Array of tasks to save
 */
function saveTasks(tasks) {
  if (!Array.isArray(tasks)) {
    console.error('Invalid tasks data:', tasks);
    return;
  }
  
  // Ensure all tasks have proper isDone state
  const validatedTasks = tasks.map(task => ({
    ...task,
    isDone: Boolean(task.isDone), // Ensure boolean
    completedDate: task.isDone ? (task.completedDate || new Date().toISOString().split('T')[0]) : undefined
  }));
  
  try {
    wx.setStorageSync(TASKS_KEY, JSON.stringify(validatedTasks));
  } catch (error) {
    console.error('Error saving tasks:', error);
  }
}

/**
 * Load tasks from storage
 * @returns {Array} Array of tasks
 */
function loadTasks() {
  try {
    const tasksData = wx.getStorageSync(TASKS_KEY);
    
    // If it's empty, return an empty array
    if (!tasksData) return [];
    
    let tasks;
    
    // Parse JSON if string
    if (typeof tasksData === 'string') {
      try {
        tasks = JSON.parse(tasksData);
      } catch (e) {
        console.error('Error parsing tasks data:', e);
        return [];
      }
    } else {
      tasks = tasksData;
    }
    
    // Convert to array if single object
    if (!Array.isArray(tasks) && typeof tasks === 'object' && tasks !== null) {
      tasks = [tasks];
    }
    
    // Ensure array and validate each task
    if (!Array.isArray(tasks)) {
      console.error('Invalid tasks data structure:', tasks);
      return [];
    }
    
    // Validate and normalize each task
    return tasks.map(task => ({
      ...task,
      isDone: Boolean(task.isDone), // Ensure boolean
      completedDate: task.isDone ? (task.completedDate || new Date().toISOString().split('T')[0]) : undefined
    }));
    
  } catch (error) {
    console.error('Error loading tasks:', error);
    return [];
  }
}

// Export using CommonJS format
module.exports = {
  saveTasks,
  loadTasks
};
