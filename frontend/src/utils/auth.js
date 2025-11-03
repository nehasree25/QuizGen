// Token management functions
export const getToken = () => localStorage.getItem('access_token');
export const getRefreshToken = () => localStorage.getItem('refresh_token');
export const setTokens = (access, refresh) => {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
};
export const removeTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};
export const isAuthenticated = () => !!getToken();

// User management functions
export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const setUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const removeUser = () => {
  localStorage.removeItem('user');
};

// API request helper with token
import API_BASE_URL from '../config';

/**
 * Helper to refresh access token using refresh token.
 * Returns true when refresh succeeded and tokens were updated.
 */
const tryRefreshToken = async () => {
  const refresh = getRefreshToken();
  if (!refresh) return false;

  try {
    const refreshUrl = API_BASE_URL.replace(/\/$/, '') + '/auth/token/refresh/';
    const resp = await fetch(refreshUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });

    if (!resp.ok) {
      console.warn('Refresh token request failed with', resp.status);
      removeTokens();
      return false;
    }

    const data = await resp.json();
    // Backend may return { access, refresh } or only { access }
    if (data.access) {
      setTokens(data.access, data.refresh || refresh);
      return true;
    }

    return false;
  } catch (err) {
    console.error('Error refreshing token:', err);
    removeTokens();
    return false;
  }
};

export const authFetch = async (url, options = {}) => {
  const token = getToken();

  // Resolve URL: if a full URL is passed, use it; otherwise prefix with API_BASE_URL
  let fullUrl = url;
  if (!/^https?:\/\//i.test(url)) {
    // ensure no double slashes
    fullUrl = API_BASE_URL.replace(/\/$/, '') + (url.startsWith('/') ? url : `/${url}`);
  }

  const makeHeaders = () => ({
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  });

  const headers = makeHeaders();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Debug logs (can be removed in production)
  console.log('Making request to:', fullUrl);
  console.log('With headers:', headers);
  console.log('With options:', options);

  let response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  // If unauthorized due to expired token, attempt refresh once and retry
  if (response.status === 401 || response.status === 403) {
    // Try to read body safely to detect token_not_valid messages (optional)
    try {
      const body = await response.clone().json().catch(() => null);
      const tokenInvalid = body && (body.code === 'token_not_valid' || (body.messages && body.messages.some(m => m.message && m.message.toLowerCase().includes('expired'))));

      if (tokenInvalid) {
        const refreshed = await tryRefreshToken();
        if (refreshed) {
          // Retry original request with new token
          const newToken = getToken();
          const retryHeaders = makeHeaders();
          if (newToken) retryHeaders['Authorization'] = `Bearer ${newToken}`;

          response = await fetch(fullUrl, {
            ...options,
            headers: retryHeaders,
          });
        } else {
          // refresh failed, clear tokens and return original response
          removeTokens();
          return response;
        }
      }
    } catch (err) {
      console.error('Error handling unauthorized response:', err);
    }
  }

  console.log('Response status:', response.status);
  console.log('Response ok:', response.ok);

  return response;
};