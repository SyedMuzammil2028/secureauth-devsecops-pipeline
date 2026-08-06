const LOCAL_API_BASE_URL = "http://127.0.0.1:8000";
const RENDER_API_BASE_URL = "https://secureauth-api-v2.onrender.com";

function getApiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_BASE_URL;

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  if (
    typeof window !== "undefined" &&
    window.location.hostname.endsWith(".onrender.com")
  ) {
    return RENDER_API_BASE_URL;
  }

  return LOCAL_API_BASE_URL;
}

const API_BASE_URL = getApiBaseUrl();

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
};

function extractErrorMessage(data: unknown): string {
  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (typeof data === "object" && data !== null) {
    const errorData = data as {
      detail?: unknown;
      message?: unknown;
      error?: unknown;
    };

    if (typeof errorData.detail === "string") {
      return errorData.detail;
    }

    if (typeof errorData.message === "string") {
      return errorData.message;
    }

    if (typeof errorData.error === "string") {
      return errorData.error;
    }

    if (Array.isArray(errorData.detail)) {
      return errorData.detail
        .map((item) => {
          if (typeof item === "object" && item !== null && "msg" in item) {
            return String((item as { msg: unknown }).msg);
          }

          return String(item);
        })
        .join(", ");
    }
  }

  return "Request failed. Please try again.";
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "POST", body } = options;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(extractErrorMessage(data));
  }

  return data as T;
}

