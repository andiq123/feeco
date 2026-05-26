const DEFAULT_BACKEND_URL = "http://localhost:8080";

export function backendURL(): string {
  return process.env.BACKEND_URL ?? DEFAULT_BACKEND_URL;
}
