import { Task, TaskPriority } from '../../types/task';
// Import only the taskManager module
const taskManager = require('../../taskManager');

interface IPageData {
  name: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
  dueTime: string;
  today: string;
  isValid: boolean;
  language: 'en' | 'zh_CN'; 
  currentHour: number;
  currentMinute: number;
}

interface IPageInstance {
  data: IPageData;
  formatDateToString(date: Date): string;
  onNameInput(e: WechatMiniprogram.Input): void;
  onDescriptionInput(e: WechatMiniprogram.Input): void;
  onPrioritySelect(e: WechatMiniprogram.TouchEvent): void;
  onDateChange(e: WechatMiniprogram.PickerChange): void;
  onTimeChange(e: WechatMiniprogram.PickerChange): void;
  validateForm(): void;
  onSubmit(): void;
  onBack(): void;
  validateTimeForToday(): void;
}

Page<IPageData, IPageInstance>({
  data: {
    name: '',
    description: '',
    priority: TaskPriority.Medium,
    dueDate: '',
    dueTime: '',
    today: '',
    isValid: false,
    language: 'en',
    currentHour: 0,
    currentMinute: 0
  },

  onLoad() {
    const today = new Date();
    const formattedDate = this.formatDateToString(today);
    const currentHour = today.getHours();
    const currentMinute = today.getMinutes();
    
    // Load language setting
    const app = getApp();
    const language = app.globalData?.language || 'en';
    
    this.setData({ 
      today: formattedDate,
      language: language,
      currentHour,
      currentMinute
    });
  },
  
  onShow() {
    // Refresh language setting when page shows
    const app = getApp();
    const language = app.globalData?.language || 'en';
    if (language !== this.data.language) {
      this.setData({ language: language });
    }
  },

  formatDateToString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  onNameInput(e: WechatMiniprogram.Input) {
    this.setData({ name: e.detail.value }, () => {
      this.validateForm();
    });
  },

  onDescriptionInput(e: WechatMiniprogram.Input) {
    const value = e.detail.value;
    // Ensure the description doesn't exceed 300 characters
    if (value.length <= 300) {
      this.setData({ description: value }, () => {
        this.validateForm();
      });
    }
  },

  onPrioritySelect(e: WechatMiniprogram.TouchEvent) {
    const priority = e.currentTarget.dataset.priority as TaskPriority;
    this.setData({ priority }, () => {
      this.validateForm();
    });
  },

  onDateChange(e: WechatMiniprogram.PickerChange) {
    const selectedDate = e.detail.value as string;
    this.setData({ dueDate: selectedDate }, () => {
      this.validateForm();
      
      // If date is today, validate the time
      if (selectedDate === this.data.today && this.data.dueTime) {
        this.validateTimeForToday();
      }
    });
  },

  onTimeChange(e: WechatMiniprogram.PickerChange) {
    const selectedTime = e.detail.value as string;
    const [hours, minutes] = selectedTime.split(':').map(Number);
    
    // Validate time if date is today
    if (this.data.dueDate === this.data.today) {
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
    
    this.setData({ dueTime: selectedTime }, () => {
      this.validateForm();
    });
  },
  
  // Helper function to validate time when date is today
  validateTimeForToday() {
    const [hours, minutes] = this.data.dueTime.split(':').map(Number);
    const { currentHour, currentMinute } = this.data;
    
    if (hours < currentHour || (hours === currentHour && minutes < currentMinute)) {
      // Reset time if it's in the past
      this.setData({ dueTime: '' }, () => {
        this.validateForm();
        
        wx.showToast({
          title: 'Time has been reset as it was in the past',
          icon: 'none'
        });
      });
    }
  },

  validateForm() {
    const { name, dueDate, dueTime } = this.data;
    const isValid = name.trim().length > 0 && 
                   dueDate.trim().length > 0 && 
                   dueTime.trim().length > 0;
    
    this.setData({ isValid });
  },

  onSubmit() {
    try {
      const { name, description, priority, dueDate, dueTime } = this.data;
      
      // Create task with date and time as strings
      const task: Task = {
        id: Date.now().toString(),
        name,
        description,
        priority,
        dueDate, // Store the original date string
        dueTime, // Store the original time string
        isDone: false, // Use isDone instead of completed
        isShared: false,
        completedBy: [], // Empty array instead of null
        createdAt: Date.now()
      };
      
      // Use taskManager to add the task
      taskManager.addTask(task);
      
      wx.showToast({
        title: this.data.language === 'en' ? 'Task added!' : '任务已添加！',
        icon: 'success'
      });
      
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (error) {
      console.error('Error adding task:', error);
      wx.showToast({
        title: this.data.language === 'en' ? 'Failed to add task' : '添加任务失败',
        icon: 'none'
      });
    }
  },

  onBack() {
    wx.navigateBack({
      delta: 1
    });
  }
});
