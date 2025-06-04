import { Task } from '../types/task';

export function loadTasks(): Task[] {
  try {
    const tasksJSON = wx.getStorageSync('tasks');
    const parsed = JSON.parse(tasksJSON || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Task loading failed:', error);
    return [];
  }
}

export function saveTasks(tasks: Task[]) {
  wx.setStorageSync('tasks', JSON.stringify(tasks));
}

// Runtime type validation
export function isTask(obj: any): obj is Task {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.isDone === 'boolean';
}
