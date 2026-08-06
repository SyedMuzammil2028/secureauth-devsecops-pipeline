const CLIENT_TEMP_TOKEN_KEY = "client_temp_token";
const CLIENT_SESSION_TOKEN_KEY = "client_session_token";
const CLIENT_LOGIN_IDENTIFIER_KEY = "client_login_identifier";

const ADMIN_TEMP_TOKEN_KEY = "admin_temp_token";
const ADMIN_SESSION_TOKEN_KEY = "admin_session_token";
const ADMIN_LOGIN_IDENTIFIER_KEY = "admin_login_identifier";

export function setClientTempToken(token: string) {
  sessionStorage.setItem(CLIENT_TEMP_TOKEN_KEY, token);
}

export function getClientTempToken() {
  return sessionStorage.getItem(CLIENT_TEMP_TOKEN_KEY);
}

export function removeClientTempToken() {
  sessionStorage.removeItem(CLIENT_TEMP_TOKEN_KEY);
}

export function setClientSession(token: string, loginIdentifier: string) {
  sessionStorage.setItem(CLIENT_SESSION_TOKEN_KEY, token);
  sessionStorage.setItem(CLIENT_LOGIN_IDENTIFIER_KEY, loginIdentifier);
}

export function getClientSessionToken() {
  return sessionStorage.getItem(CLIENT_SESSION_TOKEN_KEY);
}

export function getClientLoginIdentifier() {
  return sessionStorage.getItem(CLIENT_LOGIN_IDENTIFIER_KEY);
}

export function clearClientSession() {
  sessionStorage.removeItem(CLIENT_TEMP_TOKEN_KEY);
  sessionStorage.removeItem(CLIENT_SESSION_TOKEN_KEY);
  sessionStorage.removeItem(CLIENT_LOGIN_IDENTIFIER_KEY);
}

export function setAdminTempToken(token: string) {
  sessionStorage.setItem(ADMIN_TEMP_TOKEN_KEY, token);
}

export function getAdminTempToken() {
  return sessionStorage.getItem(ADMIN_TEMP_TOKEN_KEY);
}

export function removeAdminTempToken() {
  sessionStorage.removeItem(ADMIN_TEMP_TOKEN_KEY);
}

export function setAdminSession(token: string, loginIdentifier: string) {
  sessionStorage.setItem(ADMIN_SESSION_TOKEN_KEY, token);
  sessionStorage.setItem(ADMIN_LOGIN_IDENTIFIER_KEY, loginIdentifier);
}

export function getAdminSessionToken() {
  return sessionStorage.getItem(ADMIN_SESSION_TOKEN_KEY);
}

export function getAdminLoginIdentifier() {
  return sessionStorage.getItem(ADMIN_LOGIN_IDENTIFIER_KEY);
}

export function clearAdminSession() {
  sessionStorage.removeItem(ADMIN_TEMP_TOKEN_KEY);
  sessionStorage.removeItem(ADMIN_SESSION_TOKEN_KEY);
  sessionStorage.removeItem(ADMIN_LOGIN_IDENTIFIER_KEY);
}

export function clearAllAuthStorage() {
  clearClientSession();
  clearAdminSession();
}