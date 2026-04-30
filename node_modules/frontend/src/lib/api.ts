export type ApiError = {
  status: number;
  message: string;
};

const defaultBaseUrl = 'http://localhost:3000/api';

export function getApiBaseUrl() {
  const url = import.meta.env.VITE_API_URL as string | undefined;
  return url?.trim() ? url : defaultBaseUrl;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    let message = text || res.statusText;
    try {
      const parsed = JSON.parse(text) as { message?: string | string[] };
      if (typeof parsed.message === 'string') message = parsed.message;
      if (Array.isArray(parsed.message)) message = parsed.message.join('\n');
    } catch {
      void 0;
    }
    throw { status: res.status, message } satisfies ApiError;
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

