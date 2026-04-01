import axios from 'axios';
import { ADMIN_API_BASE_URL, ADMIN_TOKEN_STORAGE_KEY } from '../types';

export const adminApiClient = axios.create({
  baseURL: ADMIN_API_BASE_URL,
});

adminApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
