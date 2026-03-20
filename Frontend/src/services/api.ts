import axios from 'axios'

// Toggle this flag when you are ready to connect to Django
export const USE_MOCK_DATA = true

// The base URL will point to your React dev server for public files,
// or your Django server when the mock is disabled.
const BASE_URL = USE_MOCK_DATA ? '/' : 'http://localhost:8000/api/'

export const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Optional: Add interceptors here later for attaching JWT tokens
// when you implement Django authentication.
