import { useAppStore } from "../../store/appStore";

const FRIENDLY_INVALID_RESPONSE = "Server returned an invalid response.";
const FRIENDLY_BACKEND_UNAVAILABLE = "Backend is unavailable. Please try again later.";
const FRIENDLY_API_NOT_CONFIGURED = "Request failed. Please check API configuration.";

const API_BASE_URL = getApiBaseUrl();

export class ApiError extends Error {
  status: number;
  responseBody: unknown;

  constructor(message: string, status: number, responseBody: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.responseBody = responseBody;
  }
}

function normalizeBaseUrl(url?: string): string {
  if (!url) {
    return "";
  }

  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function inferDefaultApiBaseUrl(): string {
  if (typeof window === "undefined") {
    return "http://localhost:8000";
  }

  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:8000`;
}

function getApiBaseUrl(): string {
  const explicitUrl =
    import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;

  if (explicitUrl) {
    return normalizeBaseUrl(explicitUrl);
  }

  if (import.meta.env.DEV) {
    return normalizeBaseUrl(inferDefaultApiBaseUrl());
  }

  return "";
}

function buildUrl(path: string): string {
  if (!API_BASE_URL) {
    throw new ApiError(FRIENDLY_API_NOT_CONFIGURED, 0, null);
  }

  return path.startsWith("/") ? `${API_BASE_URL}${path}` : `${API_BASE_URL}/${path}`;
}

function looksLikeJson(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.startsWith("{") || trimmed.startsWith("[");
}

function getDetailFromBody(body: unknown): string | null {
  if (
    typeof body === "object" &&
    body !== null &&
    "detail" in body &&
    typeof body.detail === "string"
  ) {
    return body.detail;
  }

  if (
    typeof body === "object" &&
    body !== null &&
    "message" in body &&
    typeof body.message === "string"
  ) {
    return body.message;
  }

  return null;
}

function logApiFailure(
  label: string,
  details: {
    url: string;
    status?: number;
    contentType?: string;
    bodyPreview?: string;
    error?: unknown;
  }
) {
  console.error(`[API] ${label}`, details);
}

async function parseResponseBody(response: Response, url: string): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();

  if (!text.trim()) {
    return null;
  }

  const shouldParseJson =
    contentType.includes("application/json") || looksLikeJson(text);

  if (!shouldParseJson) {
    return text;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    logApiFailure("Invalid JSON response", {
      url,
      status: response.status,
      contentType,
      bodyPreview: text.slice(0, 300),
      error,
    });

    throw new ApiError(FRIENDLY_INVALID_RESPONSE, response.status, {
      contentType,
      bodyPreview: text.slice(0, 300),
    });
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = buildUrl(path);
  const headers = new Headers(options.headers);
  const authToken = useAppStore.getState().authToken;

  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (authToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (error) {
    logApiFailure("Network request failed", {
      url,
      error,
    });

    throw new ApiError(FRIENDLY_BACKEND_UNAVAILABLE, 0, null);
  }

  const responseBody = await parseResponseBody(response, url);

  if (!response.ok) {
    const detailedMessage = getDetailFromBody(responseBody);
    const message =
      detailedMessage ??
      (response.status >= 500
        ? FRIENDLY_BACKEND_UNAVAILABLE
        : `Request failed with status ${response.status}`);

    logApiFailure("Request failed", {
      url,
      status: response.status,
      contentType: response.headers.get("content-type") ?? "",
      bodyPreview:
        typeof responseBody === "string"
          ? responseBody.slice(0, 300)
          : JSON.stringify(responseBody).slice(0, 300),
    });

    if (response.status === 401) {
      useAppStore.getState().clearSession();
    }

    throw new ApiError(message, response.status, responseBody);
  }

  return responseBody as T;
}
