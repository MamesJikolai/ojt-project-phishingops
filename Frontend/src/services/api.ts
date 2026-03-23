import axios from 'axios'

// Toggle this flag when you are ready to connect to Django
export const USE_MOCK_DATA = false

// The base URL will point to your React dev server for public files,
// or your Django server when the mock is disabled.
const BASE_URL = USE_MOCK_DATA ? '/' : 'http://localhost:8000/api/v1/'

export const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Add a request interceptor to attach the JWT token
apiClient.interceptors.request.use(
    (config) => {
        // If we are mocking, just proceed
        if (USE_MOCK_DATA) return config

        // Grab the access token from local storage
        const token = localStorage.getItem('access_token')

        // If it exists, attach it to the Authorization header
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Optional: Add interceptors here later for attaching JWT tokens
// when you implement Django authentication.
