import axios from 'axios';

// Base url backend 
const api = axios.create({
    // Base URL fetch from .env.local 
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
        'Accept': "application/json",
        'Content-Type': 'application/json',
    },
    // Wajib diaktifkan untuk mengirim Cookie Session dan mengambil XSRF Token
    withCredentials: true,
    withXSRFToken: true
});

// Interceptor Auto Response if unauthorized (401) or CSRF token mismatch (419)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 419)) {
            if (typeof window !== 'undefined') {
                // Clear the role and XSRF cookies manually if session is invalid
                document.cookie = "role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                document.cookie = "XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                localStorage.removeItem("user");
                // Redirect to auth page when session expires or CSRF fails
                window.location.href = '/auth';
            }
        }
        return Promise.reject(error);
    }
)

export default api;