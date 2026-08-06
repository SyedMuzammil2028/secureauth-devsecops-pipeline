import { apiRequest } from "./api";

export type AdminLoginStartPayload = {
  username: string;
  password: string;
};

export type AdminLoginStartResponse = {
  status: string;
  message: string;
  temp_token: string;
};

export type AdminTempTokenPayload = {
  temp_token: string;
};

export type AdminGenerateQrResponse = {
  status: string;
  message: string;
  qr_data: string;
  username: string;
};

export type AdminMFAVerifyPayload = {
  temp_token: string;
  otp: string;
};

export type AdminMFAVerifyResponse = {
  status: string;
  message: string;
  admin_session_token: string;
};

export type AdminDashboardStats = {
  total_users: number;
  verified_emails: number;
  active_sessions: number;
  locked_accounts: number;
  recent_mfa_success_count: number;
};

export type AdminUser = {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  is_email_verified: number | boolean;
  mfa_enabled: number | boolean;
  failed_attempts: number;
  lock_until: string | null;
  is_suspended: number | boolean;
  suspension_reason: string | null;
  is_deleted: number | boolean;
  deletion_reason: string | null;
  deleted_at: string | null;
  created_at: string;
};

export type AdminLog = {
  id: number;
  user_id: number | null;
  username: string | null;
  event_type: string;
  status: string;
  ip_address: string | null;
  details: string | null;
  created_at: string;
};

export type LockedAccount = {
  id: number;
  username: string;
  email: string;
  failed_attempts: number;
  lock_until: string | null;
};

export type AdminSession = {
  id: number;
  user_id: number;
  session_token: string;
  login_identifier: string;
  ip_address: string | null;
  issued_at: string;
  expires_at: string;
  is_revoked: number | boolean;
  username: string;
  email: string;
};

export async function adminLoginStart(payload: AdminLoginStartPayload) {
  return apiRequest<AdminLoginStartResponse>("/api/admin/login-start", {
    body: payload,
  });
}

export async function generateAdminQr(payload: AdminTempTokenPayload) {
  return apiRequest<AdminGenerateQrResponse>("/api/admin/generate-qr", {
    body: payload,
  });
}

export async function verifyAdminMfa(payload: AdminMFAVerifyPayload) {
  return apiRequest<AdminMFAVerifyResponse>("/api/admin/mfa-verify", {
    body: payload,
  });
}

export async function logoutAdmin(admin_session_token: string) {
  return apiRequest<{ status: string; message: string }>("/api/admin/logout", {
    body: { admin_session_token },
  });
}

export async function getAdminDashboard(admin_session_token: string) {
  return apiRequest<AdminDashboardStats>("/api/admin/dashboard", {
    body: { admin_session_token },
  });
}

export async function getAdminUsers(admin_session_token: string) {
  return apiRequest<{ users: AdminUser[] }>("/api/admin/users", {
    body: { admin_session_token },
  });
}

export async function getAdminLogs(admin_session_token: string) {
  return apiRequest<{ logs: AdminLog[] }>("/api/admin/logs", {
    body: { admin_session_token },
  });
}

export async function clearAdminLogs(admin_session_token: string) {
  return apiRequest<{ status: string; message: string }>("/api/admin/clear-logs", {
    body: { admin_session_token },
  });
}

export async function getLockedAccounts(admin_session_token: string) {
  return apiRequest<{ locked_accounts: LockedAccount[] }>(
    "/api/admin/locked-accounts",
    {
      body: { admin_session_token },
    }
  );
}

export async function unlockUser(admin_session_token: string, user_id: number) {
  return apiRequest<{ status: string; message: string }>("/api/admin/unlock-user", {
    body: { admin_session_token, user_id },
  });
}

export async function lockUser(
  admin_session_token: string,
  user_id: number,
  lock_minutes = 10,
  reason = "Locked manually by administrator."
) {
  return apiRequest<{ status: string; message: string }>("/api/admin/lock-user", {
    body: { admin_session_token, user_id, lock_minutes, reason },
  });
}

export async function suspendUser(
  admin_session_token: string,
  user_id: number,
  is_suspended: boolean,
  reason = "Account status updated by administrator."
) {
  return apiRequest<{ status: string; message: string }>("/api/admin/suspend-user", {
    body: { admin_session_token, user_id, is_suspended, reason },
  });
}

export async function deleteUser(
  admin_session_token: string,
  user_id: number,
  reason = "Soft deleted by administrator."
) {
  return apiRequest<{ status: string; message: string }>("/api/admin/delete-user", {
    body: { admin_session_token, user_id, reason },
  });
}

export async function getAdminSessions(admin_session_token: string) {
  return apiRequest<{ sessions: AdminSession[] }>("/api/admin/sessions", {
    body: { admin_session_token },
  });
}

export async function revokeUserSession(
  admin_session_token: string,
  session_token: string
) {
  return apiRequest<{ status: string; message: string }>(
    "/api/admin/revoke-session",
    {
      body: { admin_session_token, session_token },
    }
  );
}

export async function changeAdminPassword(payload: {
  admin_session_token: string;
  current_password: string;
  new_password: string;
}) {
  return apiRequest<{ status: string; message: string }>(
    "/api/admin/change-password",
    {
      body: payload,
    }
  );
}

export async function updateAdminProfile(payload: {
  admin_session_token: string;
  username: string;
}) {
  return apiRequest<{ status: string; message: string }>(
    "/api/admin/update-profile",
    {
      body: payload,
    }
  );
}