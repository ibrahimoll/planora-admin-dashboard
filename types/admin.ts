export type AdminUserStats = {
  total_users: number;
  active_users: number;
  inactive_users: number;
  verified_users: number;
  unverified_users: number;
  admin_users: number;
};

export type AdminProjectStats = {
  total_projects: number;
  personal_projects: number;
  team_projects: number;
  not_started_projects: number;
  in_progress_projects: number;
  completed_projects: number;
  on_hold_projects: number;
  cancelled_projects: number;
};

export type AdminTaskStats = {
  total_tasks: number;
  todo_tasks: number;
  in_progress_tasks: number;
  completed_tasks: number;
  blocked_tasks: number;
  overdue_tasks: number;
};

export type AdminRiskStats = {
  total_risk_records: number;
  low_risk_records: number;
  medium_risk_records: number;
  high_risk_records: number;
};

export type AdminNotificationStats = {
  total_notifications: number;
  unread_notifications: number;
  read_notifications: number;
};

export type AdminDashboardOverview = {
  users: AdminUserStats;
  projects: AdminProjectStats;
  tasks: AdminTaskStats;
  teams_total: number;
  risks: AdminRiskStats;
  notifications: AdminNotificationStats;
  generated_at: string;
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

export type AdminProjectStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "on_hold"
  | "cancelled";

export type AdminProjectType = "personal" | "team";

export type AdminProjectOwner = {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
};

export type AdminProjectTeam = {
  team_id: number;
  name: string;
  created_by: number;
};

export type AdminProjectTaskStats = {
  total_tasks: number;
  todo_tasks: number;
  in_progress_tasks: number;
  completed_tasks: number;
  blocked_tasks: number;
  overdue_tasks: number;
  completion_percentage: number;
};

export type AdminProjectRisk = {
  risk_id: number;
  risk_level: string;
  predicted_delay_days: number;
  created_at: string;
};

export type AdminProjectSummary = {
  project_id: number;
  title: string;
  deadline: string;
  status: AdminProjectStatus;
  project_type: AdminProjectType;
  created_at: string;
  updated_at: string;
  owner: AdminProjectOwner;
  team: AdminProjectTeam | null;
  task_stats: AdminProjectTaskStats;
  latest_risk: AdminProjectRisk | null;
};

export type AdminProjectDetail = AdminProjectSummary & {
  description: string | null;
  members_count: number;
};

export type AdminProjectStatusUpdateResponse = {
  message: string;
  project: AdminProjectDetail;
  admin_log_id: number;
};

export type AdminTaskStatus = "todo" | "in_progress" | "completed" | "blocked";

export type AdminTaskPriority = "low" | "medium" | "high";

export type AdminTaskUser = {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
};

export type AdminTaskProject = {
  project_id: number;
  title: string;
  status: string;
  project_type: string;
  team_id: number | null;
  team_name: string | null;
};

export type AdminTaskSummary = {
  task_id: number;
  title: string;
  priority: AdminTaskPriority;
  status: AdminTaskStatus;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  estimated_hours: number | null;
  actual_hours: number | null;
  is_overdue: boolean;
  project: AdminTaskProject;
  assignee: AdminTaskUser | null;
  creator: AdminTaskUser;
};

export type AdminTaskDetail = AdminTaskSummary & {
  description: string | null;
  comments_count: number;
  attachments_count: number;
};

export type AdminTaskActionResponse = {
  message: string;
  task: AdminTaskDetail;
  admin_log_id: number;
};
  