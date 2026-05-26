const DEFAULT_BACKEND_URL = "http://localhost:8080";

export function backendURL(): string {
  return process.env.BACKEND_URL ?? DEFAULT_BACKEND_URL;
}

export function backendWebSocketURL(path: string): string {
  try {
    const url = new URL(path, backendURL());
    if (url.protocol === "https:") {
      url.protocol = "wss:";
    } else if (url.protocol === "http:") {
      url.protocol = "ws:";
    } else {
      return "";
    }
    return url.toString();
  } catch {
    return "";
  }
}

export function backendWebSocketOrigin(): string {
  const streamURL = backendWebSocketURL("/");
  if (!streamURL) {
    return "";
  }

  try {
    return new URL(streamURL).origin;
  } catch {
    return "";
  }
}

export function isVercelWebSocketURL(value: string): boolean {
  try {
    return new URL(value).hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
}
