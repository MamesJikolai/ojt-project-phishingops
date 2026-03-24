import { apiClient, USE_MOCK_DATA } from './api'

export const apiService = {
    /**
     * READ: Fetches a list of records.
     * @param resource The name of the endpoint or json file (e.g., 'campaigns', 'users')
     */
    getAll: async <T>(resource: string): Promise<T[]> => {
        try {
            const endpoint = USE_MOCK_DATA
                ? `dummydata/${resource}.json`
                : `${resource}/`

            const response = await apiClient.get(endpoint)

            // If DRF sends a paginated response, extract the 'results' array.
            // Otherwise, return the flat array (useful for your mock data).
            return response.data.results !== undefined
                ? response.data.results
                : response.data
        } catch (error) {
            console.error(`Error fetching ${resource}:`, error)
            throw error
        }
    },

    /**
     * READ SINGLE: Fetches a single record by its ID.
     * @param resource The name of the endpoint (e.g., 'courses')
     * @param id The ID of the specific record
     */
    getOne: async <T>(resource: string, id: string | number): Promise<T> => {
        if (USE_MOCK_DATA) {
            console.log(
                `[MOCK GET] fetching single record ${id} from ${resource}`
            )

            // Because mock data is usually a single big JSON file array,
            // we have to fetch the whole array and find the matching ID.
            const allData = await apiService.getAll<T>(resource)

            const item = (allData as any[]).find(
                (data) => String(data.id) === String(id)
            )

            if (!item) {
                throw new Error(
                    `Record with id ${id} not found in ${resource} mock data.`
                )
            }
            return item
        }

        // The real Django API call
        const response = await apiClient.get<T>(`${resource}/${id}/`)
        return response.data
    },

    /**
     * CREATE: Simulates creating a record, or sends a POST to Django.
     */
    create: async <T>(resource: string, data: Partial<T>): Promise<T> => {
        if (USE_MOCK_DATA) {
            console.log(`[MOCK POST] to ${resource}:`, data)
            // Return mocked data with a fake ID to prevent UI crashes
            return { id: Math.floor(Math.random() * 1000), ...data } as T
        }
        const response = await apiClient.post<T>(`${resource}/`, data)
        return response.data
    },

    /**
     * UPDATE: Simulates updating a record, or sends a PUT/PATCH to Django.
     */
    update: async <T>(
        resource: string,
        id: number,
        data: Partial<T>
    ): Promise<T> => {
        if (USE_MOCK_DATA) {
            console.log(`[MOCK PUT] to ${resource}/${id}:`, data)
            return { id, ...data } as T
        }
        const response = await apiClient.put<T>(`${resource}/${id}/`, data)
        return response.data
    },

    /**
     * DELETE: Simulates deleting a record, or sends a DELETE to Django.
     */
    delete: async (resource: string, id: number): Promise<void> => {
        if (USE_MOCK_DATA) {
            console.log(`[MOCK DELETE] record ${id} from ${resource}`)
            return
        }
        await apiClient.delete(`${resource}/${id}/`)
    },

    /**
     * CUSTOM ACTIONS: Campaign state management
     */
    launchCampaign: async (id: number) => {
        if (USE_MOCK_DATA) return console.log('[MOCK POST] Launch', id)
        const response = await apiClient.post(`campaigns/${id}/launch/`)
        return response.data
    },

    pauseCampaign: async (id: number): Promise<void> => {
        // ... similar logic
        await apiClient.post(`campaigns/${id}/pause/`)
    },

    /**
     * FETCH NESTED: e.g., Targets for a specific campaign
     */
    getCampaignTargets: async <T>(campaignId: number): Promise<T[]> => {
        if (USE_MOCK_DATA) return [] // or return dummy nested data

        const response = await apiClient.get<T[]>(
            `campaigns/${campaignId}/targets/`
        )
        return response.data
    },

    /**
     * AUTH: Logs the user in and saves tokens.
     */
    login: async (credentials: any) => {
        if (USE_MOCK_DATA) {
            console.log('[MOCK POST] Login', credentials)

            // 1. Set a fake token so AuthContext doesn't log you out on refresh
            localStorage.setItem('access_token', 'mock-token')

            // 2. Return a complete mock user that includes the 'role' or 'is_staff' flag!
            return {
                access: 'mock-token',
                user: {
                    id: 1,
                    username: credentials.username || 'admin_user',
                    email: 'admin@example.com',
                    first_name: 'Mock',
                    last_name: 'Admin',
                    is_staff: true,
                    role: 'admin', // <-- This is the key to getting past ProtectedRoute!
                },
            }
        }

        // This hits your Django LoginView
        const response = await apiClient.post('auth/login/', credentials)

        // Save the JWT tokens to localStorage
        if (response.data.access) {
            localStorage.setItem('access_token', response.data.access)
            localStorage.setItem('refresh_token', response.data.refresh)
        }

        return response.data
    },

    /**
     * AUTH: Gets the current logged-in user's profile
     */
    getMe: async () => {
        if (USE_MOCK_DATA)
            return { id: 1, username: 'mockuser', is_staff: true }

        const response = await apiClient.get('auth/me/')
        return response.data
    },

    /**
     * AUTH: Updates the current user's profile
     */
    updateMe: async (data: any) => {
        if (USE_MOCK_DATA) {
            console.log('[MOCK PATCH] /auth/me/', data)
            return data
        }

        const response = await apiClient.patch('auth/me/', data)
        return response.data
    },

    /**
     * AUTH: Logs the user out.
     */
    logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        // You could also hit your LogoutView here if you want to blacklist the token
    },

    /**
     * READ SINGLETON: Fetches a single object resource that doesn't use an ID (like settings)
     */
    getSingleton: async <T>(resource: string): Promise<T> => {
        if (USE_MOCK_DATA) {
            return {} as T // Or return mock settings data here
        }

        const response = await apiClient.get<T>(`${resource}/`)
        // Singletons return the object directly, not an array
        return response.data
    },

    /**
     * UPDATE SINGLETON: Updates a resource that doesn't use an ID (like settings)
     */
    updateSingleton: async <T>(
        resource: string,
        data: Partial<T>,
        method: 'POST' | 'PUT' | 'PATCH' = 'PATCH'
    ): Promise<T> => {
        if (USE_MOCK_DATA) {
            console.log(`[MOCK PUT] to ${resource}:`, data)
            return data as T
        }
        // Notice there is no /${id}/ here
        const response = await apiClient.request<T>({
            url: `${resource}/`,
            method: method,
            data: data,
        })
        return response.data
    },
}
