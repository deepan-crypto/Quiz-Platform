/**
 * Base URL for Backend API requests.
 * Configurable via VITE_API_URL environment variable.
 * Defaults to 'http://localhost:3001' in local development.
 */
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/+$/, '');

export default API_BASE_URL;
export { API_BASE_URL };
