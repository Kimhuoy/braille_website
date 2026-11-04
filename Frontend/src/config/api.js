const defaultBaseUrl = import.meta.env.DEV ? "http://localhost:5000" : "";
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL ?? defaultBaseUrl;
const normalizedBaseUrl = rawBaseUrl.endsWith("/")
  ? rawBaseUrl.slice(0, -1)
  : rawBaseUrl;

export const buildApiUrl = (path) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBaseUrl}${normalizedPath}`;
};
