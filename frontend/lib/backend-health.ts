export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch("/api/health", {
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}
