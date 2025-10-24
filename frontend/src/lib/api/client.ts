import { getApiKey } from "@/lib/utils/cookie";

const FALLBACK_BASE_URL = "http://localhost:8000";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export class ApiError extends Error {
  readonly status: number;
  readonly data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

const resolveUrl = (path: string): string => {
  const trimmedBase =
    (API_BASE_URL && API_BASE_URL.replace(/\/+$/, "")) ?? FALLBACK_BASE_URL;
  const sanitizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${trimmedBase}${sanitizedPath}`;
};

const buildHeaders = (init?: RequestInit): Headers => {
  const headers = new Headers(init?.headers ?? undefined);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // 从 Cookie 读取 API Key
  const apiKey = getApiKey();
  if (apiKey && !headers.has("X-API-Key")) {
    headers.set("X-API-Key", apiKey);
  }

  return headers;
};

export const apiFetch = async <T>(
  path: string,
  init?: RequestInit
): Promise<T> => {
  const url = resolveUrl(path);
  const headers = buildHeaders(init);

  let response: Response;
  try {
    response = await fetch(url, { ...init, headers });
  } catch (error) {
    throw new ApiError(
      error instanceof Error ? error.message : "Network request failed",
      0
    );
  }

  const text = await response.text();
  const payload = text ? safeParseJson(text) : null;

  if (!response.ok) {
    const message =
      (payload as { detail?: string })?.detail ??
      response.statusText ??
      "Request failed";
    throw new ApiError(message, response.status, payload ?? undefined);
  }

  return (payload as T) ?? ({} as T);
};

const safeParseJson = (input: string): unknown => {
  try {
    return JSON.parse(input);
  } catch {
    return input;
  }
};
