import { AxiosError } from 'axios';
import { adminApiClient } from './client';
import type {
  AdminDashboardData,
  AdminLoginResponse,
  AdminMeResponse,
  AnalyticsFilters,
  AnalyticsListResponse,
  FunnelResponse,
  InstagramConversation,
  InstagramConversationListResponse,
  InstagramFilters,
  InstagramOverviewMetrics,
  MetaSettings,
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

/* ── Instagram DM Automation API ── */

function buildInstagramParams(filters: InstagramFilters) {
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

export async function fetchInstagramOverview() {
  const response = await adminApiClient.get<{ overview: InstagramOverviewMetrics }>(
    '/admin/instagram/overview'
  );
  return response.data.overview;
}

export async function fetchInstagramConversations(filters: InstagramFilters) {
  const response = await adminApiClient.get<InstagramConversationListResponse>(
    '/admin/instagram/conversations',
    { params: buildInstagramParams(filters) }
  );
  return response.data;
}

export async function fetchInstagramConversation(id: string) {
  const response = await adminApiClient.get<{ conversation: InstagramConversation }>(
    `/admin/instagram/conversations/${id}`
  );
  return response.data.conversation;
}

export async function exportInstagramCsv(filters: InstagramFilters) {
  const response = await adminApiClient.get<Blob>('/admin/instagram/conversations', {
    params: {
      ...buildInstagramParams(filters),
      export: 'csv',
    },
    responseType: 'blob',
  });
  return response.data;
}

/* ── Meta Settings API ── */

export async function fetchMetaSettings() {
  const response = await adminApiClient.get<{ settings: MetaSettings }>(
    '/admin/settings/meta'
  );
  return response.data.settings;
}

export async function saveMetaSettings(settings: { accessToken: string; verifyToken: string; pageId: string }) {
  const response = await adminApiClient.post<{ settings: MetaSettings }>(
    '/admin/settings/meta',
    settings
  );
  return response.data.settings;
}

export async function disconnectMeta() {
  const response = await adminApiClient.delete<{ success: boolean }>(
    '/admin/settings/meta'
  );
  return response.data;
}

export async function testMetaConnection() {
  const response = await adminApiClient.post<{ connected: boolean; error?: string }>(
    '/admin/settings/meta/test'
  );
  return response.data;
}
