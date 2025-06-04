import { Task } from '../../types/task';
// Import our task management modules
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
    editingTaskPriority: 'yellow', // Default to medium priority
    editingTaskPriorityIndex: 1, // Default to medium priority index
    priorityOptions: ['Low', 'Medium', 'High'],
    editingTaskDone: false,
    selectedDate: '',
    today: '', // Today's date for date validation
    currentHour: 0, // Current hour for time validation
    currentMinute: 0, // Current minute for time validation
    userInfo: null as any,
    language: 'en',
    selectedTaskId: null as string | null,
    sharedUsersVisible: false,
    sharedUsers: [] as any[],
    // Properties for the fallback implementation in Developer Tools
    isShowingShareModal: false,
    availableFriends: [] as any[],
    selectedFriends: [] as any[],
    pendingShareTaskId: null as string | null,
    // UI text
    uiText: {
      title: 'Tasks To Do',
      addTask: 'Add Task',
      calendarView: 'Calendar View',
      listView: 'List View',
      noTasks: 'No tasks to do',
      taskActions: {
        edit: 'Edit',
        delete: 'Delete',
        save: 'Save',
        cancel: 'Cancel',
        markDone: 'Mark Done'
      },
      taskForm: {
        title: 'Edit Task',
        taskName: 'Task Name',
        taskNamePlaceholder: 'Enter task name',
        description: 'Description',
        descriptionPlaceholder: 'Enter task description',
        dueDate: 'Due Date',
        selectDate: 'Select date',
        dueTime: 'Due Time',
        selectTime: 'Select time',
        priority: 'Priority',
        low: 'Low',
        medium: 'Medium',
        high: 'High',
        doneStatus: 'Status'
      },
      calendarStatus: {
        active: 'Active',
        done: 'Done'
      }
    }
  },

  onLoad() {
    console.log('[DEBUG] do page loaded');
    this.loadTasks();
    this.loadLanguageSettings();
    
    // Initialize date and time validation variables
    const now = new Date();
    const today = this.formatDateToString(now);
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    this.setData({
      today,
      currentHour,
      currentMinute
    });
    
    // Listen for language change events
    eventBus.on('languageChanged', this.handleLanguageChange.bind(this));
  },

  onShow() {
    console.log('Component shown, loading language settings');
    this.loadTasks();
    this.loadLanguageSettings();
    // Refresh language settings
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
  
  onShareAppMessage(_res: any) {
    // Check if this is a task sharing action
    if (this.data.pendingShareTaskId) {
      const taskId = this.data.pendingShareTaskId;
      const task = this.data.tasks.find((t: any) => t.id === taskId);
      
      // Reset the pending share task
      this.setData({
        pendingShareTaskId: null
      });
      
      if (task) {
        // Mark the task as shared
        this.updateTaskAsShared(taskId);
        
        return {
          title: `Task: ${task.name}`,
          path: `/pages/do/index?sharedTaskId=${taskId}`,
          imageUrl: '/images/share-task.png' // Optional: Add a custom share image
        };
      }
    }
    
    // Default share behavior
    return {
      title: 'Task Manager',
      path: '/pages/do/index',
      imageUrl: '/images/share-default.png' // Optional: Add a custom share image
    };
  },
  
  onShareTimeline() {
    return {
      title: 'Task Manager'
    };
  },
  onAddToFavorites() {
    return {
      title: 'Task Manager',
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
      const activeTasks = allTasks.filter((task: Task) => !task.isDone);
      
      activeTasks.sort((a: Task, b: Task) => {
        const dateA = new Date(a.dueDate + ' ' + a.dueTime).getTime();
        const dateB = new Date(b.dueDate + ' ' + b.dueTime).getTime();
        return dateA - dateB;
      });

      this.setData({ 
        tasks: activeTasks,
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

  navigateToAddTask() {
    wx.navigateTo({
      url: '/pages/add-task/index'
    });
  },

  toggleCalendarView() {
    this.setData({
      isCalendarView: !this.data.isCalendarView,
      expandedTaskId: null
    });
  },

  editTask(e: any) {
    const taskId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/add-task/index?taskId=${taskId}`
    });
  },

  startInlineEdit(e: any) {
    const taskId = e.currentTarget.dataset.id;
    const allTasks: Task[] = taskStorage.loadTasks();
    const task = allTasks.find((t: Task) => t.id === taskId);
    
    if (!task) return;
    
    let priorityIndex = 1; // Default to Medium
    switch(task.priority) {
      case 'green': priorityIndex = 0; break; // Low
      case 'yellow': priorityIndex = 1; break; // Medium
      case 'red': priorityIndex = 2; break; // High
      default: priorityIndex = 1; // Default to Medium
    }
    
    this.setData({
      editingTaskId: taskId,
      editingTaskName: task.name,
      editingTaskDescription: task.description || '',
      editingTaskDueDate: task.dueDate || '',
      editingTaskDueTime: task.dueTime || '',
      editingTaskPriority: task.priority,
      editingTaskPriorityIndex: priorityIndex,
      editingTaskDone: task.isDone || false
    }, () => {
      // After setting the data, validate the date and time
      this.validateEditingTaskDateTime();
    });
  },

  onTaskNameInput(e: any) {
    this.setData({
      editingTaskName: e.detail.value
    });
  },

  onTaskDescriptionInput(e: any) {
    const value = e.detail.value;
    // Ensure the description doesn't exceed 300 characters
    if (value.length <= 300) {
      this.setData({
        editingTaskDescription: value
      });
    }
  },
  
  onTaskDueDateChange(e: any) {
    const selectedDate = e.detail.value;
    this.setData({
      editingTaskDueDate: selectedDate
    });
    
    // Reset time if date is today and current time is in the past
    if (selectedDate === this.data.today) {
      this.validateEditingTaskTime();
    }
  },
  
  onTaskDueTimeChange(e: any) {
    const selectedTime = e.detail.value;
    const [hours, minutes] = selectedTime.split(':').map(Number);
    
    // Validate time if date is today
    if (this.data.editingTaskDueDate === this.data.today) {
      const { currentHour, currentMinute } = this.data;
      
      if (hours < currentHour || (hours === currentHour && minutes < currentMinute)) {
        // Time is in the past, show error message
        wx.showToast({
          title: 'Cannot select a time in the past',
          icon: 'none'
        });
        return;
      }
    }
    
    this.setData({
      editingTaskDueTime: selectedTime
    });
  },
  
  onTaskPriorityChange(e: any) {
    const index = e.detail.value;
    let priority = 'yellow';
    
    switch(Number(index)) {
      case 0: priority = 'green'; break;
      case 1: priority = 'yellow'; break;
      case 2: priority = 'red'; break;
      default: priority = 'yellow';
    }
    
    this.setData({
      editingTaskPriorityIndex: index,
      editingTaskPriority: priority
    });
  },

  saveTaskEdit() {
    const taskId = this.data.editingTaskId;
    const allTasks: Task[] = taskStorage.loadTasks();
    
    const updatedTasks = allTasks.map((task: Task) => {
      if (task.id === taskId) {
        return {
          ...task,
          name: this.data.editingTaskName,
          description: this.data.editingTaskDescription,
          dueDate: this.data.editingTaskDueDate,
          dueTime: this.data.editingTaskDueTime,
          priority: this.data.editingTaskPriority,
          isDone: this.data.editingTaskDone
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
      editingTaskPriority: 'yellow',
      editingTaskPriorityIndex: 1,
      editingTaskDone: false
    });
    
    this.loadTasks();
    
    wx.showToast({
      title: 'Task updated',
      icon: 'success',
      duration: 2000
    });
  },

  cancelTaskEdit() {
    this.setData({
      editingTaskId: null,
      editingTaskName: '',
      editingTaskDescription: '',
      editingTaskDueDate: '',
      editingTaskDueTime: '',
      editingTaskPriority: 'yellow',
      editingTaskPriorityIndex: 1,
      editingTaskDone: false
    });
  },

  markTaskAsDone(e: any) {
    const taskId = e.currentTarget.dataset.id;
    try {
      taskManager.updateTaskStatus(taskId, true);
      
      // Refresh the task list
      this.loadTasks();
      
      wx.showToast({
        title: 'Task completed!',
        icon: 'success'
      });
    } catch (error) {
      console.error('Error marking task as done:', error);
      wx.showToast({
        title: 'Failed to complete task',
        icon: 'none'
      });
    }
  },

  deleteTask(e: any) {
    const taskId = e.currentTarget.dataset.id;
    wx.showModal({
      title: 'Delete Task',
      content: 'Are you sure you want to delete this task?',
      success: (res) => {
        if (res.confirm) {
          try {
            // Use taskManager to delete the task
            taskManager.deleteTask(taskId);
            
            // Reload tasks from storage
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

  // Get user information from WeChat
  getUserInfo() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      
      if (userInfo) {
        this.setData({ userInfo });
      } else {
        // For first time users, request user info
        wx.getUserProfile({
          desc: 'Used for task sharing and management',
          success: (res) => {
            const userInfo = {
              ...res.userInfo,
              openId: 'user_' + Math.random().toString(36).substring(2, 10) // Mock OpenID for demo purposes
            };
            
            wx.setStorageSync('userInfo', userInfo);
            this.setData({ userInfo });
          },
          fail: (err) => {
            console.error('Failed to get user profile:', err);
            // Create a basic user profile if getUserProfile fails
            const basicUserInfo = {
              nickName: 'User',
              avatarUrl: '',
              openId: 'user_' + Math.random().toString(36).substring(2, 10)
            };
            wx.setStorageSync('userInfo', basicUserInfo);
            this.setData({ userInfo: basicUserInfo });
          }
        });
      }
    } catch (error) {
      console.error('Error getting user info:', error);
    }
  },
  
  // Open the sharing dialog for a task
  shareTask(e: any) {
    const taskId = e.currentTarget.dataset.id;
    
    // Check if user info is available
    if (!this.data.userInfo) {
      this.getUserInfo();
      if (!this.data.userInfo) {
        wx.showToast({
          title: 'Please login to share tasks',
          icon: 'none'
        });
        return;
      }
    }
    
    // Store the task ID for sharing
    this.setData({
      selectedTaskId: taskId
    });
    
    // Check if running in Developer Tools
    const systemInfo = wx.getSystemInfoSync();
    const isDevTools = systemInfo.platform === 'devtools';
    
    if (isDevTools) {
      // Fallback for Developer Tools
      wx.showModal({
        title: 'Developer Tools Limitation',
        content: 'The wx.chooseContact API is not available in Developer Tools. This would open the WeChat contact picker in the real WeChat environment.',
        showCancel: false,
        success: () => {
          // Simulate sharing with mock friends for testing
          const mockFriends = [
            {
              openId: 'friend_1',
              nickname: 'Alice',
              avatarUrl: 'https://pic.rmb.bdstatic.com/bjh/user/2df0d278f48f68eca8e17927bf47b60d.jpeg'
            }
          ];
          
          this.shareTaskWithFriends(mockFriends);
        }
      });
    } else {
      // Use native WeChat contact selector
      wx.chooseContact({
        success: (res: any) => {  
          console.log('Selected contact:', res);
          
          // Convert WeChat contact to the format expected by shareTask
          // The API returns a single contact at a time
          const selectedFriend = {
            openId: res.openId || 'contact_' + Math.random().toString(36).substring(2, 10),
            nickname: res.displayName || res.nickName || 'Friend',
            avatarUrl: res.avatarUrl || ''
          };
          
          // Share the task with selected friend
          this.shareTaskWithFriends([selectedFriend]);
        },
        fail: (err) => {
          console.error('Failed to select contact:', err);
          wx.showToast({
            title: 'Failed to select contact',
            icon: 'none'
          });
        }
      });
    }
  },
  
  // Update a task as shared
  updateTaskAsShared(taskId: string) {
    const allTasks: Task[] = taskStorage.loadTasks();
    
    const updatedTasks = allTasks.map((task: Task) => {
      if (task.id === taskId) {
        return {
          ...task,
          isShared: true,
          // We don't know the exact friends the user shared with using the native sharing,
          // so we'll just mark it as shared
          sharedWith: task.sharedWith || []
        };
      }
      return task;
    });
    
    taskStorage.saveTasks(updatedTasks);
    this.loadTasks();
  },
  
  // Share task with selected friends
  shareTaskWithFriends(selectedFriends: any[]) {
    const { selectedTaskId } = this.data;
    
    if (!selectedTaskId || !selectedFriends.length) {
      wx.showToast({
        title: 'Please select at least one friend',
        icon: 'none'
      });
      return;
    }
    
    try {
      taskManager.shareTask(selectedTaskId, selectedFriends);
      
      wx.showToast({
        title: 'Task shared successfully!',
        icon: 'success'
      });
      
      // Reset selection and refresh tasks
      this.setData({
        selectedTaskId: null
      });
      
      this.loadTasks();
      
      // In a real app, we would call WeChat API to notify friends
      console.log(`Shared task ${selectedTaskId} with ${selectedFriends.length} friends`);
    } catch (error) {
      console.error('Error sharing task:', error);
      wx.showToast({
        title: error instanceof Error ? error.message : 'Failed to share task',
        icon: 'none'
      });
    }
  },
  
  // Get mock friends list for testing in Developer Tools
  // Removed mock friends implementation
  
  // Show details of users who are sharing a task
  showSharedUsers(e: any) {
    const taskId = e.currentTarget.dataset.id;
    const task = this.data.tasks.find((t: Task) => t.id === taskId);
    
    if (task && task.isShared) {
      this.setData({
        sharedUsersVisible: true,
        sharedUsers: task.sharedWith
      });
    }
  },
  
  // Accept a shared task invitation
  acceptSharedTask(taskId: string) {
    try {
      if (!this.data.userInfo) {
        this.getUserInfo();
        if (!this.data.userInfo) {
          throw new Error('User info required');
        }
      }
      
      taskManager.acceptSharedTask(taskId, this.data.userInfo.openId);
      this.loadTasks();
      
      wx.showToast({
        title: 'Task accepted!',
        icon: 'success'
      });
    } catch (error) {
      console.error('Error accepting shared task:', error);
      wx.showToast({
        title: 'Failed to accept task',
        icon: 'none'
      });
    }
  },
  
  // Process shared task invitations (would be called from app.js or when opening the app from notification)
  processSharedTaskInvitation(options: any) {
    if (options && options.taskId) {
      const { taskId } = options;
      
      wx.showModal({
        title: 'Task Invitation',
        content: 'Would you like to accept this shared task?',
        confirmText: 'Accept',
        cancelText: 'Decline',
        success: (res) => {
          if (res.confirm) {
            this.acceptSharedTask(taskId);
          }
        }
      });
    }
  },
  
  // Add this method to handle shared task completion check
  hasUserCompletedSharedTask(task: Task): boolean {
    const userInfo = this.data.userInfo;
    if (!userInfo || !task.isShared || !task.sharedWith) return false;
    return task.sharedWith.some(
      (user: any) => user.openId === userInfo.openId && user.completedTask
    );
  },
  
  closeSharedUsersModal() {
    this.setData({
      sharedUsersVisible: false,
      sharedUsers: []
    });
  },
  
  // Check if a shared task has any accepted users
  hasAcceptedUsers(task: Task): boolean {
    if (!task || !task.sharedWith || task.sharedWith.length === 0) {
      return false;
    }
    return task.sharedWith.some(user => user.accepted) || false;
  },
  
  async switchLanguage(newLanguage: string) {
    try {
      wx.setStorageSync('language', newLanguage);
      await this.loadLanguageSettings();
      wx.showToast({
        title: newLanguage === 'en' ? 'Language switched to English' : '语言已切换为中文',
        icon: 'none'
      });
    } catch (error) {
      console.error('Error switching language:', error);
    }
  },

  async loadLanguageSettings() {
    // Get language from app global data or storage
    const app = getApp();
    const language = app.globalData?.language || wx.getStorageSync('language') || 'en';
    
    // Convert zh_CN to zh for compatibility
    const normalizedLanguage = language === 'zh_CN' ? 'zh' : language;
    
    // Update the language in the page data
    this.setData({ language: normalizedLanguage });
    
    const uiText = {
      en: {
        title: 'Tasks To Do',
        addTask: 'Add Task',
        calendarView: 'Calendar View',
        listView: 'List View',
        noTasks: 'No tasks to do',
        taskActions: {
          edit: 'Edit',
          delete: 'Delete',
          save: 'Save',
          cancel: 'Cancel',
          markDone: 'Mark Done'
        },
        taskForm: {
          title: 'Edit Task',
          taskName: 'Task Name',
          taskNamePlaceholder: 'Enter task name',
          description: 'Description',
          descriptionPlaceholder: 'Enter task description',
          dueDate: 'Due Date',
          selectDate: 'Select date',
          dueTime: 'Due Time',
          selectTime: 'Select time',
          priority: 'Priority',
          low: 'Low',
          medium: 'Medium',
          high: 'High',
          doneStatus: 'Status'
        },
        calendarStatus: {
          active: 'Active',
          done: 'Done'
        }
      },
      zh: {
        title: '待办任务',
        addTask: '添加任务',
        calendarView: '日历视图',
        listView: '列表视图',
        noTasks: '没有待办任务',
        taskActions: {
          edit: '编辑',
          delete: '删除',
          save: '保存',
          cancel: '取消',
          markDone: '标记完成'
        },
        taskForm: {
          title: '编辑任务',
          taskName: '任务名称',
          taskNamePlaceholder: '输入任务名称',
          description: '描述',
          descriptionPlaceholder: '输入任务描述',
          dueDate: '截止日期',
          selectDate: '选择日期',
          dueTime: '截止时间',
          selectTime: '选择时间',
          priority: '优先级',
          low: '低',
          medium: '中',
          high: '高',
          doneStatus: '状态'
        },
        calendarStatus: {
          active: '进行中',
          done: '已完成'
        }
      }
    } as const;
    
    this.setData({ uiText: uiText[normalizedLanguage === 'zh' ? 'zh' : 'en'] });
    
    // Update priority options based on language
    this.setData({
      priorityOptions: [
        normalizedLanguage === 'en' ? 'Low' : '低',
        normalizedLanguage === 'en' ? 'Medium' : '中',
        normalizedLanguage === 'en' ? 'High' : '高'
      ]
    });
  },

  // Handle language change event from other pages
  handleLanguageChange(language: string) {
    console.log('[DEBUG] Language changed event received:', language);
    this.loadLanguageSettings();
  },

  formatDateToString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },
  
  // Helper function to validate and reset time if needed
  validateEditingTaskTime() {
    if (!this.data.editingTaskDueTime) return;
    
    const [hours, minutes] = this.data.editingTaskDueTime.split(':').map(Number);
    const { currentHour, currentMinute } = this.data;
    
    if (hours < currentHour || (hours === currentHour && minutes < currentMinute)) {
      // Reset time if it's in the past
      this.setData({
        editingTaskDueTime: ''
      });
      
      wx.showToast({
        title: 'Time has been reset as it was in the past',
        icon: 'none'
      });
    }
  },
  
  validateEditingTaskDateTime() {
    const { editingTaskDueDate, editingTaskDueTime } = this.data;
    if (!editingTaskDueDate || !editingTaskDueTime) return;
    
    const [hours, minutes] = editingTaskDueTime.split(':').map(Number);
    const { currentHour, currentMinute } = this.data;
    
    if (editingTaskDueDate === this.data.today) {
      if (hours < currentHour || (hours === currentHour && minutes < currentMinute)) {
        // Reset time if it's in the past
        this.setData({
          editingTaskDueTime: ''
        });
        
        wx.showToast({
          title: 'Time has been reset as it was in the past',
          icon: 'none'
        });
      }
    }
  },
});