Page({
  data: {
    selectedDate: '',
    tasks: [],
    currentMonth: '',
    currentYear: ''
  },

  onLoad: function() {
    const now = new Date()
    this.setData({
      selectedDate: now.toISOString().split('T')[0],
      currentMonth: now.getMonth() + 1,
      currentYear: now.getFullYear()
    })
    this.loadTasks()
  },

  loadTasks: function() {
    const tasks = wx.getStorageSync('tasks') || []
    this.setData({ tasks: tasks })
  },

  onShow: function() {
    this.loadTasks()
  },

  onDateSelect: function(e) {
    const date = e.detail.value
    this.setData({ selectedDate: date })
    this.filterTasks()
  },

  filterTasks: function() {
    const tasks = this.data.tasks.filter(task => 
      task.date === this.data.selectedDate
    )
    this.setData({ filteredTasks: tasks })
  }
}) 