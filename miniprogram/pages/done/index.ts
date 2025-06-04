import { Task } from '../../types/task';
const taskManager = require('../../taskManager');
const taskStorage = require('../../taskStorage');
import eventBus from '../../utils/eventBus';

Page({
  data: {
    tasks: [] as Task[],
    allTasks: [] as Task[],  // Store all tasks for calendar view
    expandedTaskId: null as string | null,
    isCalendarView: false,
    editingTaskId: null as string | null,
    editingTaskName: '',
    editingTaskDescription: '',
    editingTaskDueDate: '',
    editingTaskDueTime: '',
    editingTaskPriority: 'none',
    editingTaskPriorityIndex: 0,
    priorityOptions: ['None', 'Low', 'Medium', 'High'],
    language: '',
    taskActions: {},
    editingCharCount: 0,
    // UI text
    uiText: {
      title: 'Completed Tasks',
      noTasks: 'No Completed Tasks',
      taskForm: {
        taskName: 'Task Name',
        description: 'Description',
        dueDate: 'Due Date',
        selectDate: 'Select date',
        dueTime: 'Due Time',
        selectTime: 'Select time',
        priority: 'Priority'
      }
    }
  },

  onLoad() {
    this.loadTasks();
    this.loadLanguageSettings();
    // Listen for language change events
    eventBus.on('languageChanged', this.handleLanguageChange.bind(this));
  },

  onShow() {
    this.loadTasks();
    this.loadLanguageSettings();
  },

  onHide() {
    this.setData({ expandedTaskId: null });
  },

  onUnload() {
    // Remove event listeners to prevent memory leaks
    eventBus.off('languageChanged', this.handleLanguageChange);
  },

  onReady() {},
  onRouteDone() {},
  onPullDownRefresh() {
    this.loadTasks();
    wx.stopPullDownRefresh();
  },
  onReachBottom() {},
  onShareAppMessage() {
    return {
      title: 'Task Manager - Completed Tasks',
      path: '/pages/done/index'
    };
  },
  onShareTimeline() {
    return {
      title: 'Task Manager - Completed Tasks'
    };
  },
  onAddToFavorites() {
    return {
      title: 'Task Manager - Completed Tasks',
      imageUrl: '/assets/icon.png'
    };
  },
  onPageScroll() {},
  onResize() {},
  onTabItemTap() {},
  onSaveExitState() {
    return {
      data: this.data
    };
  },

  loadTasks() {
    try {
      const allTasks = taskManager.getTasks();
      const completedTasks = allTasks.filter((task: Task) => task.isDone === true); // Explicitly check for true
      
      this.setData({ 
        tasks: completedTasks,
        allTasks,
        expandedTaskId: null
      });
    } catch (error) {
      console.error('Error loading tasks:', error);
      this.setData({ 
        tasks: [],
        allTasks: [],
        expandedTaskId: null
      });
    }
  },

  toggleTaskExpand(e: any) {
    const taskId = e.currentTarget.dataset.id;
    if (this.data.expandedTaskId === taskId) {
      this.setData({ expandedTaskId: null });
    } else {
      this.setData({ expandedTaskId: taskId });
    }
  },

  toggleCalendarView() {
    this.setData({
      isCalendarView: !this.data.isCalendarView,
      expandedTaskId: null
    });
  },

  startInlineEdit(e: any) {
    const taskId = e.currentTarget.dataset.id;
    try {
      const allTasks = taskStorage.loadTasks();
      const task = allTasks.find((t: Task) => t.id === taskId);
      
      if (!task) return;
      
      let priorityIndex = 0;
      switch(task.priority) {
        case 'green': priorityIndex = 1; break;
        case 'yellow': priorityIndex = 2; break;
        case 'red': priorityIndex = 3; break;
        default: priorityIndex = 0;
      }
      
      this.setData({
        editingTaskId: taskId,
        editingTaskName: task.name,
        editingTaskDescription: task.description || '',
        editingTaskDueDate: task.dueDate || '',
        editingTaskDueTime: task.dueTime || '',
        editingTaskPriority: task.priority || 'none',
        editingTaskPriorityIndex: priorityIndex,
        editingCharCount: task.description?.length || 0
      });
    } catch (error) {
      console.error('Error starting inline edit:', error);
      wx.showToast({
        title: 'Failed to edit task',
        icon: 'none'
      });
    }
  },

  onTaskNameInput(e: any) {
    this.setData({
      editingTaskName: e.detail.value
    });
  },

  onTaskDescriptionInput(e: any) {
    const value = e.detail.value;
    if (value.length > 300) {
      wx.showToast({
        title: 'Description must be 300 characters or less',
        icon: 'none'
      });
      return;
    }
    this.setData({
      editingTaskDescription: value,
      editingCharCount: value.length
    });
  },
  
  onTaskDueDateChange(e: any) {
    this.setData({
      editingTaskDueDate: e.detail.value
    });
  },
  
  onTaskDueTimeChange(e: any) {
    this.setData({
      editingTaskDueTime: e.detail.value
    });
  },
  
  onTaskPriorityChange(e: any) {
    const index = e.detail.value;
    let priority = 'none';
    
    switch(Number(index)) {
      case 1: priority = 'green'; break;
      case 2: priority = 'yellow'; break;
      case 3: priority = 'red'; break;
      default: priority = 'none';
    }
    
    this.setData({
      editingTaskPriorityIndex: index,
      editingTaskPriority: priority
    });
  },

  saveTaskEdit(e: any) {
    if (this.data.editingTaskDescription.length > 300) {
      wx.showToast({
        title: 'Description must be 300 characters or less',
        icon: 'none'
      });
      return;
    }
    const taskId = e.currentTarget.dataset.id;
    try {
      const allTasks = taskStorage.loadTasks();
      
      const updatedTasks = allTasks.map((task: Task) => {
        if (task.id === taskId) {
          return {
            ...task,
            name: this.data.editingTaskName,
            description: this.data.editingTaskDescription,
            dueDate: this.data.editingTaskDueDate,
            dueTime: this.data.editingTaskDueTime,
            priority: this.data.editingTaskPriority
          };
        }
        return task;
      });
      
      taskStorage.saveTasks(updatedTasks);
      
      this.setData({
        editingTaskId: null,
        editingTaskName: '',
        editingTaskDescription: '',
        editingTaskDueDate: '',
        editingTaskDueTime: '',
        editingTaskPriority: 'none',
        editingTaskPriorityIndex: 0,
        editingCharCount: 0
      });
      
      this.loadTasks();
      
      wx.showToast({
        title: 'Task updated',
        icon: 'success',
        duration: 2000
      });
    } catch (error) {
      console.error('Error saving task edit:', error);
      wx.showToast({
        title: 'Failed to update task',
        icon: 'none'
      });
    }
  },

  cancelTaskEdit() {
    this.setData({
      editingTaskId: null,
      editingTaskName: '',
      editingTaskDescription: '',
      editingTaskDueDate: '',
      editingTaskDueTime: '',
      editingTaskPriority: 'none',
      editingTaskPriorityIndex: 0,
      editingCharCount: 0
    });
  },

  deleteTask(e: any) {
    const taskId = e.currentTarget.dataset.id;
    wx.showModal({
      title: 'Delete Task',
      content: 'Are you sure you want to delete this task?',
      success: (res) => {
        if (res.confirm) {
          try {
            taskManager.deleteTask(taskId);
            
            this.loadTasks();
            
            wx.showToast({
              title: 'Task deleted',
              icon: 'success'
            });
          } catch (error) {
            console.error('Error deleting task:', error);
            wx.showToast({
              title: 'Failed to delete task',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  moveTaskBack(e: any) {
    const taskId = e.currentTarget.dataset.id;
    try {
      taskManager.updateTaskStatus(taskId, false);
      
      // Refresh the task list
      this.loadTasks();
      
      wx.showToast({
        title: 'Task moved back',
        icon: 'success'
      });
    } catch (error) {
      console.error('Error moving task back:', error);
      wx.showToast({
        title: 'Failed to move task',
        icon: 'none'
      });
    }
  },

  async loadLanguageSettings() {
    try {
      // Get language from app global data or storage
      const app = getApp();
      const language = app.globalData?.language || wx.getStorageSync('language') || 'en';
      
      // Normalize language code
      const normalizedLanguage = language === 'zh_CN' ? 'zh' : language;
      
      // Update the language in the page data
      this.setData({ language: normalizedLanguage });
      
      // Define translations based on language
      let taskActions;
      
      if (normalizedLanguage === 'en') {
        // English translations
        taskActions = {
          edit: 'Edit',
          delete: 'Delete',
          save: 'Save',
          cancel: 'Cancel',
          back: 'Back'
        };
        
        // Update UI text for English
        this.setData({
          uiText: {
            title: 'Completed Tasks',
            noTasks: 'No Completed Tasks',
            taskForm: {
              taskName: 'Task Name',
              description: 'Description',
              dueDate: 'Due Date',
              selectDate: 'Select date',
              dueTime: 'Due Time',
              selectTime: 'Select time',
              priority: 'Priority'
            }
          }
        });
      } else {
        // Chinese translations
        taskActions = {
          edit: '编辑',
          delete: '删除',
          save: '保存',
          cancel: '取消',
          back: '返回'
        };
        
        // Update UI text for Chinese
        this.setData({
          uiText: {
            title: '已完成任务',
            noTasks: '没有已完成任务',
            taskForm: {
              taskName: '任务名称',
              description: '描述',
              dueDate: '截止日期',
              selectDate: '选择日期',
              dueTime: '截止时间',
              selectTime: '选择时间',
              priority: '优先级'
            }
          }
        });
      }
      
      this.setData({ 
        taskActions
      });
    } catch (error) {
      console.error('Error loading language settings:', error);
      wx.showToast({
        title: 'Failed to load translations',
        icon: 'none'
      });
    }
  },
  
  // Handle language change event from other pages
  handleLanguageChange(language: string) {
    console.log('[DEBUG] Language changed event received:', language);
    this.loadLanguageSettings();
  }
});