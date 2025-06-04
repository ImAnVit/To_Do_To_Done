import { Task } from '../../types/task';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

Component({
  properties: {
    tasks: {
      type: Array,
      value: []
    },
    selectedDate: {
      type: String,
      value: ''
    }
  },

  data: {
    weekDays: WEEK_DAYS,
    days: [] as Array<{
      date: string;
      day: number;
      isCurrentMonth: boolean;
      tasks: Task[];
    }>,
    currentMonthYear: '',
    currentSelectedDate: '',
    currentDate: new Date(),
    currentMonth: 0,
    currentYear: 0,
    showTaskDetails: false,
    selectedDayTasks: [] as Task[],
    selectedDateFormatted: ''
  },

  lifetimes: {
    attached() {
      const today = new Date();
      this.setData({ 
        currentSelectedDate: this.properties.selectedDate || this.formatDateToString(today),
        currentDate: today,
        currentMonth: today.getMonth(),
        currentYear: today.getFullYear()
      });
      this.generateCalendar(today);
    }
  },

  observers: {
    'tasks, selectedDate'(tasks: Task[], selectedDate: string) {
      if (Array.isArray(tasks)) {
        this.generateCalendar(new Date(this.data.currentYear, this.data.currentMonth));
      }
      if (selectedDate) {
        this.setData({ currentSelectedDate: selectedDate });
      }
    }
  },

  methods: {
    formatDateToString(date: Date): string {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },

    formatDate(dateString: string): string {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      const monthName = MONTH_NAMES[date.getMonth()];
      return `${monthName} ${day}`;
    },

    generateCalendar(date: Date) {
      const year = date.getFullYear();
      const month = date.getMonth();
      
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      const days = [];
      const startingDay = firstDay.getDay();
      
      // Add days from previous month
      const prevMonth = new Date(year, month, 0);
      const prevMonthLastDate = prevMonth.getDate();
      
      for (let i = startingDay - 1; i >= 0; i--) {
        const day = prevMonthLastDate - i;
        const currentDate = new Date(year, month - 1, day);
        const dateString = this.formatDateToString(currentDate);
        
        days.push({
          date: dateString,
          day,
          isCurrentMonth: false,
          tasks: this.getTasksForDate(dateString)
        });
      }
      
      // Add days from current month
      const currentMonthDays = lastDay.getDate();
      for (let day = 1; day <= currentMonthDays; day++) {
        const currentDate = new Date(year, month, day);
        const dateString = this.formatDateToString(currentDate);
        
        days.push({
          date: dateString,
          day,
          isCurrentMonth: true,
          tasks: this.getTasksForDate(dateString)
        });
      }
      
      // Add days from next month
      const remainingDays = 42 - days.length; // 6 rows * 7 days
      for (let day = 1; day <= remainingDays; day++) {
        const currentDate = new Date(year, month + 1, day);
        const dateString = this.formatDateToString(currentDate);
        
        days.push({
          date: dateString,
          day,
          isCurrentMonth: false,
          tasks: this.getTasksForDate(dateString)
        });
      }
      
      this.setData({
        days,
        currentMonthYear: `${MONTH_NAMES[month]} ${year}`,
        currentMonth: month,
        currentYear: year
      });
    },

    getTasksForDate(date: string): Task[] {
      return (this.properties.tasks as Task[]).filter(task => task.dueDate === date);
    },

    onDaySelect(e: any) {
      const date = e.currentTarget.dataset.date;
      const tasks = this.getTasksForDate(date);
      
      this.setData({ 
        currentSelectedDate: date,
        showTaskDetails: tasks.length > 0,
        selectedDayTasks: tasks,
        selectedDateFormatted: this.formatDate(date)
      });
      
      this.triggerEvent('dayClick', {
        date,
        tasks
      });
    },

    closeTaskDetails() {
      this.setData({
        showTaskDetails: false
      });
    },

    prevMonth() {
      const newDate = new Date(this.data.currentYear, this.data.currentMonth - 1);
      this.generateCalendar(newDate);
    },

    nextMonth() {
      const newDate = new Date(this.data.currentYear, this.data.currentMonth + 1);
      this.generateCalendar(newDate);
    }
  }
});