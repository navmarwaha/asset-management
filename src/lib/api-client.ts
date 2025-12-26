/**
 * API Client for communicating with the backend
 * Replaces Supabase client calls
 */

// Ensure API_BASE_URL always ends with /api
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  // Remove trailing slash if present
  const baseUrl = envUrl.replace(/\/$/, '');
  // Add /api if not already present
  return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
};

const API_BASE_URL = getApiBaseUrl();

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Set auth token in localStorage
export const setAuthToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

// Remove auth token from localStorage
export const removeAuthToken = (): void => {
  localStorage.removeItem('auth_token');
};

// Generic API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  // Only log in development
  if (import.meta.env.DEV) {
    console.log('API Request:', url, { method: options.method || 'GET' });
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Check if response is JSON
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    console.error('Non-JSON response received:', {
      status: response.status,
      statusText: response.statusText,
      contentType,
      url,
      body: text.substring(0, 200), // First 200 chars
    });
    throw new Error(`Expected JSON but received ${contentType}. Status: ${response.status}. URL: ${url}`);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// API client methods
export const api = {
  // Assets
  assets: {
    getAll: (page = 1, pageSize = 1000) =>
      apiRequest<{ data: any[]; pagination: any }>(`/assets?page=${page}&pageSize=${pageSize}`),
    
    getAllWithoutPagination: () =>
      apiRequest<{ data: any[] }>('/assets/all'),
    
    getById: (id: string) =>
      apiRequest<{ data: any }>(`/assets/${id}`),
    
    create: (asset: any) =>
      apiRequest<{ data: any }>('/assets', {
        method: 'POST',
        body: JSON.stringify(asset),
      }),
    
    update: (id: string, updates: any) =>
      apiRequest<{ data: any }>(`/assets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
    
    delete: (id: string) =>
      apiRequest<{ message: string; data: any }>(`/assets/${id}`, {
        method: 'DELETE',
      }),
    
    getHistory: (id: string) =>
      apiRequest<{ data: any[] }>(`/assets/${id}/history`),
    
    logHistory: (id: string, history: any) =>
      apiRequest<{ data: any }>(`/assets/${id}/history`, {
        method: 'POST',
        body: JSON.stringify(history),
      }),
  },

  // Pending Requests
  pendingRequests: {
    getAll: () =>
      apiRequest<{ data: any[] }>('/pending-requests'),
    
    getCount: () =>
      apiRequest<{ count: number }>('/pending-requests/count'),
    
    getById: (id: string) =>
      apiRequest<{ data: any }>(`/pending-requests/${id}`),
    
    create: (request: any) =>
      apiRequest<{ data: any }>('/pending-requests', {
        method: 'POST',
        body: JSON.stringify(request),
      }),
    
    update: (id: string, updates: any) =>
      apiRequest<{ data: any }>(`/pending-requests/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
    
    delete: (id: string) =>
      apiRequest<{ message: string; data: any }>(`/pending-requests/${id}`, {
        method: 'DELETE',
      }),
  },

  // Employees
  employees: {
    getAll: () =>
      apiRequest<{ data: any[] }>('/employees'),
    
    getById: (id: string) =>
      apiRequest<{ data: any }>(`/employees/${id}`),
    
    create: (employee: any) =>
      apiRequest<{ data: any }>('/employees', {
        method: 'POST',
        body: JSON.stringify(employee),
      }),
    
    createBulk: (employees: any[]) =>
      apiRequest<{ created: number; errors: number; data: any[]; errors_detail: any[] }>('/employees/bulk', {
        method: 'POST',
        body: JSON.stringify({ employees }),
      }),
    
    update: (id: string, updates: any) =>
      apiRequest<{ data: any }>(`/employees/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
    
    delete: (id: string) =>
      apiRequest<{ message: string; data: any }>(`/employees/${id}`, {
        method: 'DELETE',
      }),
  },

  // Users
  users: {
    getAll: () =>
      apiRequest<{ data: any[] }>('/users'),
    
    getMe: () =>
      apiRequest<{ data: any }>('/users/me'),
    
    getByEmail: (email: string) =>
      apiRequest<{ data: any }>(`/users/${email}`),
    
    create: (user: any) =>
      apiRequest<{ data: any }>('/users', {
        method: 'POST',
        body: JSON.stringify(user),
      }),
    
    update: (email: string, updates: any) =>
      apiRequest<{ data: any }>(`/users/${email}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
    
    delete: (email: string) =>
      apiRequest<{ message: string; data: any }>(`/users/${email}`, {
        method: 'DELETE',
      }),
  },

  // Orders
  orders: {
    getAll: (filters?: { orderType?: string; materialType?: string; startDate?: string; endDate?: string }) => {
      const params = new URLSearchParams();
      if (filters?.orderType) params.append('orderType', filters.orderType);
      if (filters?.materialType) params.append('materialType', filters.materialType);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      const queryString = params.toString();
      return apiRequest<{ data: any[] }>(`/orders${queryString ? `?${queryString}` : ''}`);
    },
    
    getById: (id: string) =>
      apiRequest<{ data: any }>(`/orders/${id}`),
    
    create: (order: any) =>
      apiRequest<{ data: any }>('/orders', {
        method: 'POST',
        body: JSON.stringify(order),
      }),
    
    update: (id: string, updates: any) =>
      apiRequest<{ data: any }>(`/orders/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
    
    delete: (id: string) =>
      apiRequest<{ message: string; data: any }>(`/orders/${id}`, {
        method: 'DELETE',
      }),
  },

  // Auth
  auth: {
    getMe: () =>
      apiRequest<{ user: any }>('/auth/me'),
    
    logout: () =>
      apiRequest<{ message: string }>('/auth/logout', {
        method: 'POST',
      }),
    
    refresh: () =>
      apiRequest<{ token: string }>('/auth/refresh', {
        method: 'POST',
      }),
  },

  // Notifications
  notifications: {
    getAll: (params?: { limit?: number; offset?: number; unread_only?: boolean }) => {
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset) queryParams.append('offset', params.offset.toString());
      if (params?.unread_only) queryParams.append('unread_only', 'true');
      const queryString = queryParams.toString();
      return apiRequest<{ data: any[] }>(`/notifications${queryString ? `?${queryString}` : ''}`);
    },
    
    getUnreadCount: () =>
      apiRequest<{ count: number }>('/notifications/unread-count'),
    
    markAsRead: (id: string) =>
      apiRequest<{ data: any }>(`/notifications/${id}/read`, {
        method: 'PUT',
      }),
    
    markAllAsRead: () =>
      apiRequest<{ data: any[]; count: number }>('/notifications/read-all', {
        method: 'PUT',
      }),
  },
};

export default api;

