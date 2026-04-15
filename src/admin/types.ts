export const ADMIN_API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;
export const ADMIN_TOKEN_STORAGE_KEY = 'admin_jwt_token';

export interface AdminUser {
  _id?: string;
  id?: string;
  username: string;
  role: string;
}

export interface AdminLoginResponse {
  token: string;
  admin: AdminUser;
}

export interface AdminMeResponse {
  admin: AdminUser;
}

export interface OverviewMetrics {
  totalUsers: number;
  totalProfessionals: number;
  totalFans: number;
  emailsCollected: number;
  phonesCollected: number;
}

export interface OverviewResponse {
  overview: OverviewMetrics;
}

export interface AnalyticsRow {
  _id: string;
  userId: string;
  profileType: string;
  classificationSource: string;
  status: string;
  tags: string[];
  capturedData?: {
    email?: string;
    phone?: string;
  };
  createdAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AnalyticsListResponse {
  rows: AnalyticsRow[];
  pagination: PaginationMeta;
}

export interface TagCount {
  tag: string;
  count: number;
}

export interface TagsResponse {
  tags: TagCount[];
}

export interface FunnelMetrics {
  ACTIVE: number;
  WAITING_FOR_CONTACT: number;
  COMPLETED: number;
}

export interface FunnelResponse {
  funnel: FunnelMetrics;
}

export interface AnalyticsFilters {
  page: number;
  limit: number;
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  profileType: string;
  classificationSource: string;
  status: string;
  startDate: string;
  endDate: string;
}

export interface AdminDashboardData {
  overview: OverviewMetrics;
  analytics: AnalyticsListResponse;
  tags: TagCount[];
  funnel: FunnelMetrics;
}

/* ── Instagram DM Automation ── */

export interface InstagramMessage {
  _id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface InstagramConversation {
  _id: string;
  senderId: string;
  senderName?: string;
  profileType?: string;
  status: 'ACTIVE' | 'WAITING_FOR_CONTACT' | 'COMPLETED';
  tags: string[];
  capturedData?: {
    email?: string;
    phone?: string;
  };
  messages: InstagramMessage[];
  lastMessagePreview?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InstagramConversationListResponse {
  rows: InstagramConversation[];
  pagination: PaginationMeta;
}

export interface InstagramFilters {
  page: number;
  limit: number;
  search: string;
  status: string;
  profileType: string;
  tag: string;
  startDate: string;
  endDate: string;
}

export interface InstagramOverviewMetrics {
  totalConversations: number;
  activeConversations: number;
  completedConversations: number;
  emailsCaptured: number;
  phonesCaptured: number;
}

export interface MetaSettings {
  accessToken: string;
  verifyToken: string;
  pageId: string;
  isConnected: boolean;
  connectedAt?: string;
}
