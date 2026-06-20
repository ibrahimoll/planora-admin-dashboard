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

export type AdminPaginationState = {
  limit: number;
  offset: number;
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

export type AdminSubtask = {
  subtask_id: number;
  task_id: number;
  created_by: number;
  title: string;
  is_completed: boolean;
  status: "todo" | "completed";
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminTaskDetail = AdminTaskSummary & {
  description: string | null;
  comments_count: number;
  attachments_count: number;
  subtasks: AdminSubtask[];
  subtask_count: number;
  completed_subtask_count: number;
  progress_percentage: number;
};

export type AdminTaskActionResponse = {
  message: string;
  task: AdminTaskDetail;
  admin_log_id: number;
};

export type AdminRiskCenterSummary = {
  total_projects: number;
  projects_with_risk_records: number;
  high_risk_projects: number;
  medium_risk_projects: number;
  low_risk_projects: number;
  overdue_active_projects: number;
  blocked_task_projects: number;
  generated_at: string;
};

export type AdminHighRiskProject = {
  project: AdminProjectSummary;
  risk_id: number;
  risk_level: string;
  predicted_delay_days: number;
  reason: string;
  recommendation: string;
  created_at: string;
};

export type AdminReportProjectSummary = {
  project_id: number;
  title: string;
  description: string | null;
  status: AdminProjectStatus;
  project_type: AdminProjectType;
  deadline: string;
  created_at: string;
  updated_at: string;
};

export type AdminReportProgressSummary = {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  overdue_tasks: number;
  completion_percentage: number;
};

export type AdminReportTaskStatusCounts = {
  todo: number;
  in_progress: number;
  completed: number;
  blocked: number;
};

export type AdminReportTaskPriorityCounts = {
  low: number;
  medium: number;
  high: number;
};

export type AdminReportHoursSummary = {
  estimated_hours_total: number;
  actual_hours_total: number;
};

export type AdminReportActivitySummary = {
  comments_count: number;
  attachments_count: number;
  deadline_reminders_count: number;
};

export type AdminReportMemberItem = {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
};

export type AdminReportTaskItem = {
  task_id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigned_to: number | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
};

export type AdminProjectReportResponse = {
  generated_at: string;
  project: AdminReportProjectSummary;
  progress: AdminReportProgressSummary;
  task_status_counts: AdminReportTaskStatusCounts;
  task_priority_counts: AdminReportTaskPriorityCounts;
  hours: AdminReportHoursSummary;
  activity: AdminReportActivitySummary;
  members: AdminReportMemberItem[];
  tasks: AdminReportTaskItem[];
};

export type AdminLog = {
  log_id: number;
  admin_id: number;
  target_user_id: number | null;
  action: string;
  created_at: string;
};

export type AdminNotificationType =
  | "task"
  | "project"
  | "team"
  | "comment"
  | "mention"
  | "invite"
  | "deadline"
  | "ai"
  | "risk"
  | "system";

export type AdminNotification = {
  notification_id: number;
  user_id: number;
  title: string;
  message: string;
  is_read: boolean;
  type: AdminNotificationType;
  created_at: string;
};

export type AdminNotificationUnreadCount = {
  unread_count: number;
};

export type AdminNotificationMessageResponse = {
  message: string;
};

export type FirebasePushStatus = {
  firebase_enabled: boolean;
  firebase_configured: boolean;
  message: string;
};

export type AdminNotificationPreference = {
  preference_id: number;
  user_id: number;
  task_notifications: boolean;
  project_notifications: boolean;
  team_notifications: boolean;
  comment_notifications: boolean;
  mention_notifications: boolean;
  invite_notifications: boolean;
  deadline_notifications: boolean;
  ai_notifications: boolean;
  risk_notifications: boolean;
  system_notifications: boolean;
  push_enabled: boolean;
  email_enabled: boolean;
  updated_at: string;
  created_at: string;
};

export type AdminNotificationPreferenceKey =
  | "task_notifications"
  | "project_notifications"
  | "team_notifications"
  | "comment_notifications"
  | "mention_notifications"
  | "invite_notifications"
  | "deadline_notifications"
  | "ai_notifications"
  | "risk_notifications"
  | "system_notifications"
  | "push_enabled"
  | "email_enabled";

export type AdminDeviceToken = {
  device_token_id: number;
  user_id: number;
  token: string;
  platform: "android" | "ios" | "web";
  is_active: boolean;
  last_used_at: string;
  created_at: string;
};

export type AdminPushTestResponse = {
  status: string;
  detail: string;
  sent_count: number;
  skipped_count: number;
  failed_count: number;
  deactivated_tokens: number;
};

export type AdminSystemSummaryReport = {
  users_total: number;
  users_active: number;
  users_inactive: number;
  admins_total: number;
  projects_total: number;
  team_projects: number;
  personal_projects: number;
  tasks_total: number;
  overdue_tasks: number;
  blocked_tasks: number;
  high_risk_records: number;
  teams_total: number;
  generated_at: string;
};

export type AdminProjectsSummaryReport = {
  projects_total: number;
  not_started: number;
  in_progress: number;
  completed: number;
  on_hold: number;
  cancelled: number;
  average_completion_percentage: number;
  generated_at: string;
};

export type AdminUsersSummaryReport = {
  users_total: number;
  active_users: number;
  inactive_users: number;
  verified_users: number;
  unverified_users: number;
  admin_users: number;
  users_with_assigned_tasks: number;
  generated_at: string;
};
