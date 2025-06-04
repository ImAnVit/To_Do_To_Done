// Add task page
const taskManager = require('../../taskManager');
const taskStorage = require('../../taskStorage');

Page({
  data: {
    taskText: '',
    dueDate: '',
    priority: 'medium',
    categories: [],
    selectedCategories: [],
    showCategoryPicker: false,
    description: '',
    charCount: 0
  },

  onLoad: function() {
    // Load categories if needed
    try {
      const categories = wx.getStorageSync('categories');
      if (categories) {
        this.setData({
          categories: typeof categories === 'string' ? JSON.parse(categories) : categories
        });
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      this.setData({ categories: [] });
    }
  },

  // Handle input changes
  onTaskTextChange: function(e) {
    this.setData({
      taskText: e.detail.value
    });
  },

  onDueDateChange: function(e) {
    this.setData({
      dueDate: e.detail.value
    });
  },

  onPriorityChange: function(e) {
    this.setData({
      priority: e.detail.value
    });
  },

  toggleCategoryPicker: function() {
    this.setData({
      showCategoryPicker: !this.data.showCategoryPicker
    });
  },

  onCategorySelect: function(e) {
    const category = e.currentTarget.dataset.category;
    const selectedCategories = [...this.data.selectedCategories];
    
    const index = selectedCategories.indexOf(category);
    if (index === -1) {
      selectedCategories.push(category);
    } else {
      selectedCategories.splice(index, 1);
    }
    
    this.setData({
      selectedCategories
    });
  },

  onDescriptionInput: function(e) {
    const value = e.detail.value;
    if (value.length > 300) {
      wx.showToast({
        title: 'Description must be 300 characters or less',
        icon: 'none'
      });
      return;
    }
    this.setData({
      description: value,
      charCount: value.length
    });
  },

  // Form submission
  onSubmit: function(e) {
    if (!this.data.taskText.trim()) {
      wx.showToast({
        title: 'Please enter a task',
        icon: 'none'
      });
      return;
    }

    try {
      // Create new task object
      const newTask = {
        text: this.data.taskText,
        completed: false,
        dueDate: this.data.dueDate || null,
        priority: this.data.priority,
        categories: this.data.selectedCategories,
        description: this.data.description,
        createdAt: new Date().toISOString()
      };

      // Add task using taskManager
      taskManager.addTask(newTask);

      // Show success message
      wx.showToast({
        title: 'Task added successfully',
        icon: 'success'
      });

      // Navigate back or clear form
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (error) {
      console.error('Error adding task:', error);
      wx.showToast({
        title: 'Failed to add task',
        icon: 'none'
      });
    }
  },

  // Cancel and go back
  onCancel: function() {
    wx.navigateBack();
  }
});
