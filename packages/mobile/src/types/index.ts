export interface Task {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  color?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  tasks: Task[];
  createdAt: Date;
  updatedAt: Date;
}
