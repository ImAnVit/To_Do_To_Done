export enum TaskPriority {
  High = 'red',
  Medium = 'yellow',
  Low = 'green'
}

export interface SharedUser {
  openId: string;
  nickname: string;
  avatarUrl: string;
  accepted: boolean;
  completedTask: boolean;
}

export interface Task {
  id: string;
  name: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
  dueTime: string;
  isDone: boolean;
  createdAt: number;
  completedDate?: string;
  isExpanded?: boolean;
  
  // Sharing-related fields
  creatorId?: string;
  isShared: boolean;
  sharedWith?: SharedUser[];
  completedBy: string[];
  allCompleted?: boolean;
}