import { apiRequest } from "./api";

export type RegisterStartPayload = {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password: string;
  date_of_birth: string;
  gender: string;
  nationality: string;
  country_code: string;
  phone_number: string;
  postal_code: string;
};

export type VerifyEmailPayload = RegisterStartPayload & {
  otp_code: string;
};

export type LoginStartPayload = {
  login_identifier: string;
  password: string;
};

export type LoginStartResponse = {
  status: string;
  message: string;
  nonce: string;
  login_identifier: string;
  next_step: string;
};

export type LoginVerifyPayload = {
  login_identifier: string;
  password: string;
  nonce: string;
  hmac_response: string;
};

export type LoginVerifyResponse = {
  status: string;
  message: string;
  temp_token: string;
  next_step: string;
};

export type TempTokenPayload = {
  temp_token: string;
};

export type GenerateQrResponse = {
  status: string;
  message: string;
  qr_data: string;
  username: string;
};

export type MFAVerifyPayload = {
  temp_token: string;
  otp: string;
};

export type MFAVerifyResponse = {
  status: string;
  message: string;
  session_token: string;
  username: string;
  next_step: string;
};

export type LogoutPayload = {
  session_token: string;
};

export type UserProfileResponse = {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  date_of_birth: string;
  gender: string;
  nationality: string;
  country_code: string;
  phone_number: string;
  is_email_verified: boolean;
  mfa_enabled: boolean;
  session: {
    session_token: string;
    login_identifier: string;
    ip_address: string;
    issued_at: string;
    expires_at: string;
  };
};

export type UserSessionsResponse = {
  sessions: {
    id: number;
    session_token: string;
    login_identifier: string;
    ip_address: string;
    issued_at: string;
    expires_at: string;
    is_revoked: boolean;
  }[];
};

export type RequestEmailChangeResponse = {
  status: string;
  message: string;
  new_email: string;
};

export type VerifyEmailChangeResponse = {
  status: string;
  message: string;
};

export async function registerStart(payload: RegisterStartPayload) {
  return apiRequest<{ status: string; message: string; email: string; next_step: string }>(
    "/api/client/register-start",
    { body: payload }
  );
}

export async function verifyEmailOtp(payload: VerifyEmailPayload) {
  return apiRequest<{ status: string; message: string; user_id: number; username: string; next_step: string }>(
    "/api/client/verify-email-otp",
    { body: payload }
  );
}

export async function loginStart(payload: LoginStartPayload) {
  return apiRequest<LoginStartResponse>("/api/client/login-start", { body: payload });
}

export async function loginVerify(payload: LoginVerifyPayload) {
  return apiRequest<LoginVerifyResponse>("/api/client/login-verify", { body: payload });
}

export async function generateClientQr(payload: TempTokenPayload) {
  return apiRequest<GenerateQrResponse>("/api/client/generate-qr", { body: payload });
}

export async function verifyClientMfa(payload: MFAVerifyPayload) {
  return apiRequest<MFAVerifyResponse>("/api/client/mfa-verify", { body: payload });
}

export async function logoutClient(payload: LogoutPayload) {
  return apiRequest<{ status: string; message: string }>("/api/client/logout", { body: payload });
}

export async function getUserProfile(session_token: string) {
  return apiRequest<UserProfileResponse>("/api/user/profile", {
    body: { session_token },
  });
}

export async function getUserSessions(session_token: string) {
  return apiRequest<UserSessionsResponse>("/api/user/sessions", {
    body: { session_token },
  });
}

export async function requestEmailChange(session_token: string, new_email: string) {
  return apiRequest<RequestEmailChangeResponse>("/api/auth/change-email/request", {
    body: { session_token, new_email },
  });
}

export async function verifyEmailChange(
  session_token: string,
  new_email: string,
  otp_code: string
) {
  return apiRequest<VerifyEmailChangeResponse>("/api/auth/change-email/verify", {
    body: { session_token, new_email, otp_code },
  });
}

export async function deleteOwnAccount(
  session_token: string,
  otp: string,
  reason = "User requested account deletion."
) {
  return apiRequest<{ status: string; message: string }>("/api/user/delete-account", {
    body: { session_token, otp, reason },
  });
}