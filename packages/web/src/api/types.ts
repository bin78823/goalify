export interface Project {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  progress: number;
  dependencies: string;
  is_milestone: boolean;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectRequest {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  icon?: string;
}

export interface UpdateProjectRequest {
  id: string;
  name?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  icon?: string | null;
}

export interface CreateTaskRequest {
  project_id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  progress: number;
  dependencies: string;
  is_milestone: boolean;
  color?: string;
}

export interface UpdateTaskRequest {
  id: string;
  project_id?: string;
  name?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  progress?: number;
  dependencies?: string;
  is_milestone?: boolean;
  color?: string;
}
