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
            const response = await apiClient.get<T[]>(endpoint)
            return response.data
        } catch (error) {
            console.error(`Error fetching ${resource}:`, error)
            throw error
        }
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
}
