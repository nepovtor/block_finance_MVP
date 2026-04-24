const API_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    inferDefaultApiBaseUrl()
);

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
    return "";
  }

  const { protocol, hostname } = window.location;

  const isLocalHost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0";
  const isLanAddress =
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname);

  if (isLocalHost || isLanAddress) {
    return `${protocol}//${hostname}:8000`;
  }

  return "";
}

function buildUrl(path: string): string {
  if (!API_BASE_URL) {
    return path;
  }

  return path.startsWith("/") ? `${API_BASE_URL}${path}` : `${API_BASE_URL}/${path}`;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text || null;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    headers,
  });

  const responseBody = await parseResponseBody(response);

  if (!response.ok) {
    const message =
      typeof responseBody === "string" && responseBody
        ? responseBody
        : `Request failed with status ${response.status}`;

    throw new ApiError(message, response.status, responseBody);
  }

  return responseBody as T;
}
