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
  dependencies?: string;
  is_milestone?: boolean;
  color?: string;
}

export type SubtaskStatus = "todo" | "in_progress" | "done";

export interface Subtask {
  id: string;
  parent_id: string;
  name: string;
  description: string;
  status: SubtaskStatus;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSubtaskRequest {
  parent_id: string;
  name: string;
  description?: string;
  status?: SubtaskStatus;
  order_index?: number;
}

export interface UpdateSubtaskRequest {
  id: string;
  name?: string;
  description?: string;
  status?: SubtaskStatus;
  order_index?: number;
}

export interface SupabaseUser {
  id: string;
  email: string;
  is_member?: boolean;
  membership_started_at?: string | null;
  membership_expires_at?: string | null;
}

export interface AuthResult {
  success: boolean;
  user: SupabaseUser | null;
  message: string | null;
}
