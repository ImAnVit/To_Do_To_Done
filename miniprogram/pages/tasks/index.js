// Task list page
const taskManager = require('../../taskManager');

Page({
  data: {
    tasks: [],
    newTaskText: '',
    taskActions: {
      edit: 'Edit',
      delete: 'Delete'
    },
    language: 'en'
  },

  onLoad: function() {
    this.loadTasks();
    this.loadLanguageSettings();
  },

  onShow: function() {
    this.loadTasks();
    this.loadLanguageSettings();
  },

  loadTasks: function() {
    this.setData({
      tasks: taskManager.getTasks()
    });
  },

  // Add a new task
  onInputChange: function(e) {
    this.setData({
      newTaskText: e.detail.value
    });
  },

  addTask: function() {
    if (!this.data.newTaskText.trim()) return;
    
    taskManager.addTask({
      text: this.data.newTaskText,
      completed: false
    });
    
    this.setData({
      newTaskText: '',
      tasks: taskManager.getTasks()
    });
  },

  // Delete a task
  deleteTask: function(e) {
    const taskId = e.currentTarget.dataset.id;
    const confirmText = this.data.language === 'zh' ? '确认删除' : 'Confirm Delete';
    const contentText = this.data.language === 'zh' ? '您确定要删除此任务吗？' : 'Are you sure you want to delete this task?';
    
    wx.showModal({
      title: confirmText,
      content: contentText,
      success: (res) => {
        if (res.confirm) {
          taskManager.deleteTask(taskId);
          this.loadTasks();
        }
      }
    });
  },

  // Toggle task completion
  toggleComplete: function(e) {
    const taskId = e.currentTarget.dataset.id;
    const tasks = taskManager.getTasks();
    const task = tasks.find(t => t.id === taskId);
    
    if (task) {
      task.completed = !task.completed;
      taskManager.saveTasks(tasks);
      this.loadTasks();
    }
  },

  // Load language settings
  loadLanguageSettings: function() {
    try {
      const app = getApp();
      // Avoid optional chaining for compatibility
      const language = (app.globalData && app.globalData.language) ? app.globalData.language : (wx.getStorageSync('language') || 'en');
      
      let taskActions = {
        edit: 'Edit',
        delete: 'Delete'
      };
      
      if (language === 'zh') {
        taskActions = {
          edit: '编辑',
          delete: '删除'
        };
      }
      
      this.setData({
        language,
        taskActions
      });
    } catch (error) {
      console.error('Error loading language settings:', error);
    }
  }
});
