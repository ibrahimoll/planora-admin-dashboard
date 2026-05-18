export type AdminOverview = {
  total_users: number;
  active_users: number;
  total_projects: number;
  active_projects: number;
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks?: number;
  high_risk_projects?: number;
};

export type AdminUser = {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  role: "user" | "admin";
  is_active: boolean;
  is_email_verified: boolean;
  created_at: string;
};

export type AdminUserCounts = {
  projects_created: number;
  assigned_tasks: number;
  created_tasks: number;
  notifications: number;
  admin_logs_as_target: number;
};

export type AdminUserDetail = AdminUser & {
  profile_pic: string | null;
  counts: AdminUserCounts;
};

export type AdminUserActionResponse = {
  message: string;
  user: AdminUserDetail;
  admin_log_id: number;
};

export type AdminActivityLog = {
  activity_id: number;
  project_id: number;
  task_id: number | null;
  actor_id: number | null;
  event_type: string;
  message: string;
  created_at: string;
};

export type AdminProject = {
  project_id: number;
  title: string;
  status: string;
  project_type: "personal" | "team";
  deadline: string | null;
  created_at: string;
};

export type AdminTask = {
  task_id: number;
  project_id: number;
  title: string;
  status: string;
  priority: "low" | "medium" | "high";
  due_date: string | null;
};
