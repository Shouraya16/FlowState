export function apiFetch(url, options = {}) {
  const token = localStorage.getItem("token")
  return fetch(`http://localhost:8000${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      ...options.headers,
    }
  })
}