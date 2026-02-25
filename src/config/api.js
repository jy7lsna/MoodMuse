// API base URL — empty string in dev (uses Vite proxy), full URL in production
const API_BASE = import.meta.env.VITE_API_URL || '';

export default API_BASE;
