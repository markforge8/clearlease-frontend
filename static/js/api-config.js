// API Configuration
const BACKEND_BASE_URL = 'https://clearlease-production.up.railway.app';

// API Endpoints
const API_ENDPOINTS = {
    ANALYZE: `${BACKEND_BASE_URL}/analyze`,
    HISTORY: `${BACKEND_BASE_URL}/history`,
    EXPORT_PDF: `${BACKEND_BASE_URL}/export/pdf`,
    ME: `${BACKEND_BASE_URL}/api/me`
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BACKEND_BASE_URL, API_ENDPOINTS };
}