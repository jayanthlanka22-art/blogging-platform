const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error: {
    message: string;
    code: string;
    details: any;
  } | null;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null;
}

// Memory storage for access token
let inMemoryAccessToken: string | null = null;
let refreshSubscribers: ((token: string) => void)[] = [];
let isRefreshing = false;

export const setAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;
};

export const getAccessToken = () => inMemoryAccessToken;

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.map((callback) => callback(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

// Auto token refresh logic
const handleTokenRefresh = async (): Promise<string | null> => {
  if (isRefreshing) {
    return new Promise((resolve) => {
      addRefreshSubscriber((token) => {
        resolve(token);
      });
    });
  }

  isRefreshing = true;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Credentials includes cookies (refreshToken)
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Refresh failed');
    }

    const result: ApiResponse<{ accessToken: string }> = await response.json();
    if (result.success && result.data?.accessToken) {
      const newToken = result.data.accessToken;
      setAccessToken(newToken);
      onTokenRefreshed(newToken);
      return newToken;
    }
    
    return null;
  } catch {
    setAccessToken(null);
    return null;
  } finally {
    isRefreshing = false;
  }
};

export const request = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Set headers
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  
  if (inMemoryAccessToken) {
    headers.set('Authorization', `Bearer ${inMemoryAccessToken}`);
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // vital for sending HTTP refresh cookie
  };

  try {
    let response = await fetch(url, fetchOptions);

    // If unauthorized, attempt refresh token rotation
    if (response.status === 401) {
      const newToken = await handleTokenRefresh();
      if (newToken) {
        // Retry original request with new token
        headers.set('Authorization', `Bearer ${newToken}`);
        response = await fetch(url, fetchOptions);
      } else {
        // Refresh failed, clear session and force logout event
        setAccessToken(null);
        window.dispatchEvent(new Event('auth-logout'));
      }
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return { success: true, data: null, error: null, meta: null };
    }

    const data: ApiResponse<T> = await response.json();
    return data;
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: {
        message: error.message || 'Network request failed',
        code: 'NETWORK_ERROR',
        details: null,
      },
      meta: null,
    };
  }
};
