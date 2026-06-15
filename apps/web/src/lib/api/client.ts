/**
 * API client tipado com interceptors de auth e retry.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function getAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const { useAuthStore } = await import("@/store/auth.store");
  return useAuthStore.getState().accessToken;
}

async function refreshAccessToken(): Promise<string | null> {
  const { useAuthStore } = await import("@/store/auth.store");
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) return null;

  const resp = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!resp.ok) {
    useAuthStore.getState().logout();
    return null;
  }

  const data = await resp.json();
  useAuthStore.getState().setTokens(data.access_token, data.refresh_token);
  return data.access_token;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let accessToken = await getAccessToken();

  const makeRequest = async (token: string | null) => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    return fetch(`${API_BASE}${path}`, { ...options, headers });
  };

  let response = await makeRequest(accessToken);

  if (response.status === 401 && accessToken) {
    accessToken = await refreshAccessToken();
    response = await makeRequest(accessToken);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      body.error?.code ?? "UNKNOWN_ERROR",
      body.error?.message ?? `HTTP ${response.status}`
    );
  }

  if (response.status === 204) return null as T;
  return response.json();
}

export const api = {
  get: <T>(path: string) => apiRequest<T>(path, { method: "GET" }),
  post: <T>(path: string, body: unknown) =>
    apiRequest<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    apiRequest<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: "DELETE" }),
};
