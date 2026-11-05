export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem("@giro:token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  // Se o token expirou ou é inválido, desloga
  if (response.status === 401 && !endpoint.includes("/api/auth/")) {
    localStorage.removeItem("@giro:token");
    window.location.reload();
  }

  return response;
}
