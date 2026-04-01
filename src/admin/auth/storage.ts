import { ADMIN_TOKEN_STORAGE_KEY } from '../types';

export function getStoredAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
}

export function setStoredAdminToken(token: string) {
  localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
}

export function clearStoredAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
}
