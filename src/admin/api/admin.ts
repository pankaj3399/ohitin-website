import { AxiosError } from 'axios';
import { adminApiClient } from './client';
import type {
  AdminDashboardData,
  AdminLoginResponse,
  AdminMeResponse,
  AnalyticsFilters,
  AnalyticsListResponse,
  FunnelResponse,
  OverviewResponse,
  TagsResponse,
} from '../types';

export interface LoginCredentials {
  username: string;
  password: string;
}

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong.') {
  if (error instanceof AxiosError) {
    const message =
      (error.response?.data as { message?: string } | undefined)?.message ??
      error.message;

    return message || fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function buildAnalyticsParams(filters: AnalyticsFilters) {
  return Object.entries(filters).reduce<Record<string, string | number>>(
    (params, [key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        params[key] = value;
      }

      return params;
    },
    {}
  );
}

export async function loginAdmin(credentials: LoginCredentials) {
  const response = await adminApiClient.post<AdminLoginResponse>(
    '/admin/login',
    credentials
  );

  return response.data;
}

export async function fetchAdminMe() {
  const response = await adminApiClient.get<AdminMeResponse>('/admin/me');

  return response.data.admin;
}

export async function fetchOverview() {
  const response = await adminApiClient.get<OverviewResponse>(
    '/admin/analytics/overview'
  );

  return response.data.overview;
}

export async function fetchAnalyticsList(filters: AnalyticsFilters) {
  const response = await adminApiClient.get<AnalyticsListResponse>(
    '/admin/analytics/list',
    {
      params: buildAnalyticsParams(filters),
    }
  );

  return response.data;
}

export async function fetchTags() {
  const response = await adminApiClient.get<TagsResponse>('/admin/analytics/tags');

  return response.data.tags;
}

export async function fetchFunnel() {
  const response = await adminApiClient.get<FunnelResponse>(
    '/admin/analytics/funnel'
  );

  return response.data.funnel;
}

export async function fetchDashboardData(filters: AnalyticsFilters) {
  const [overview, analytics, tags, funnel] = await Promise.all([
    fetchOverview(),
    fetchAnalyticsList(filters),
    fetchTags(),
    fetchFunnel(),
  ]);

  const data: AdminDashboardData = {
    overview,
    analytics,
    tags,
    funnel,
  };

  return data;
}

export async function exportAnalyticsCsv(filters: AnalyticsFilters) {
  const response = await adminApiClient.get<Blob>('/admin/analytics/list', {
    params: {
      ...buildAnalyticsParams(filters),
      export: 'csv',
    },
    responseType: 'blob',
  });

  return response.data;
}
