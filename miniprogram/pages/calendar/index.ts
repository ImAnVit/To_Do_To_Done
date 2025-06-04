import { Task } from '../../types/task';
import eventBus from '../../utils/eventBus';

Page({
  data: {
    selectedDate: '',
    tasks: [] as Task[],
    selectedTasks: [] as Task[],
    language: 'en' as 'en' | 'zh_CN'
  },

  onLoad() {
    const now = new Date();
    this.setData({
      selectedDate: now.toISOString().split('T')[0]
    });
    this.loadTasks();
    this.loadLanguageSetting();

    // Listen for language changes
    eventBus.on('languageChanged', this.onLanguageChanged.bind(this));
  },

  onUnload() {
    // Clean up event listener
    eventBus.off('languageChanged', this.onLanguageChanged.bind(this));
  },

  onShow() {
    this.loadTasks();
  },

  loadTasks() {
    const tasks = wx.getStorageSync('tasks') || [];
    this.setData({ 
      tasks,
      selectedTasks: this.getTasksForDate(this.data.selectedDate, tasks)
    });
  },

  loadLanguageSetting() {
    const settings = wx.getStorageSync('settings') || {};
    this.setData({
      language: settings.language ?? 'en'
    });
  },

  onLanguageChanged(language: 'en' | 'zh_CN') {
    this.setData({ language });
  },

  getTasksForDate(date: string, tasks: Task[]): Task[] {
    return tasks
      .filter(task => task.dueDate === date)
      .map(task => ({
        ...task,
        priorityColor: task.priority === 'red' ? '#ff4d4f' : 
                      task.priority === 'yellow' ? '#faad14' : '#52c41a'
      }))
      .sort((a, b) => {
        // Sort by completion status (active first)
        if (a.isDone !== b.isDone) {
          return a.isDone ? 1 : -1;
        }
        // Then by time
        return a.dueTime.localeCompare(b.dueTime);
      });
  },

  onDayClick(e: any) {
    const { date, tasks } = e.detail;
    this.setData({
      selectedDate: date,
      selectedTasks: this.getTasksForDate(date, this.data.tasks)
    });
  }
}); 