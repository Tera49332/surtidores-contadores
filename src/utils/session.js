// Session management with Role-Based Access Control (RBAC)
// Roles: 'admin' (PIN 35253) or 'operator' (PIN 12589)

const SESSION_KEY = 'active_business_id';
const AUTH_KEY = 'app_authenticated';
const ROLE_KEY = 'app_user_role';

export function setUserSession(businessId, role = 'operator') {
  sessionStorage.setItem(SESSION_KEY, businessId);
  sessionStorage.setItem(AUTH_KEY, 'true');
  sessionStorage.setItem(ROLE_KEY, role);

  try {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(ROLE_KEY);
  } catch (e) {}
}

export function setActiveBusiness(businessId) {
  setUserSession(businessId, 'operator');
}

export function getActiveBusinessId() {
  return sessionStorage.getItem(SESSION_KEY) || null;
}

export function setActiveBusinessId(businessId) {
  sessionStorage.setItem(SESSION_KEY, businessId);
}

export function getUserRole() {
  return sessionStorage.getItem(ROLE_KEY) || 'operator';
}

export function isAdmin() {
  return isAuthenticated() && getUserRole() === 'admin';
}

export function isOperator() {
  return isAuthenticated() && getUserRole() === 'operator';
}

export function isAuthenticated() {
  return sessionStorage.getItem(AUTH_KEY) === 'true' && getActiveBusinessId() !== null;
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(ROLE_KEY);
  try {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(ROLE_KEY);
  } catch (e) {}
}
