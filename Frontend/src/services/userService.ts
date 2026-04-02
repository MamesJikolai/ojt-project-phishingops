import { apiClient } from './api'

export const apiService = {
    /**
     * READ: Fetches a list of records.
     * @param resource The name of the endpoint or json file (e.g., 'campaigns', 'users')
     */
    getAll: async <T>(resource: string): Promise<T[]> => {
        try {
            const endpoint = resource

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
        const response = await apiClient.get<T>(`${resource}/${id}/`)

        return response.data
    },

    /**
     * CREATE: Simulates creating a record, or sends a POST to Django.
     */
    create: async <T>(resource: string, data: Partial<T>): Promise<T> => {
        const response = await apiClient.post<T>(`${resource}/`, data)

        return response.data
    },

    /**
     * UPDATE: Simulates updating a record, or sends a PUT/PATCH to Django.
     */
    update: async <T>(
        resource: string,
        id: number,
        data: Partial<T>,
        method: 'PUT' | 'PATCH' = 'PUT'
    ): Promise<T> => {
        const response = await apiClient.request<T>({
            url: `${resource}/${id}/`,
            method: method,
            data: data,
        })

        return response.data
    },

    /**
     * DELETE: Simulates deleting a record, or sends a DELETE to Django.
     */
    delete: async (resource: string, id: number): Promise<void> => {
        await apiClient.delete(`${resource}/${id}/`)
    },

    /**
     * CUSTOM ACTIONS: Campaign state management
     */
    launchCampaign: async (id: number) => {
        const response = await apiClient.post(`campaigns/${id}/launch/`)

        return response.data
    },

    pauseCampaign: async (id: number): Promise<void> => {
        await apiClient.post(`campaigns/${id}/pause/`)
    },

    completeCampaign: async (id: number): Promise<void> => {
        await apiClient.post(`campaigns/${id}/complete/`)
    },

    /**
     * FETCH NESTED: e.g., Targets for a specific campaign
     */
    getCampaignTargets: async <T>(campaignId: number): Promise<T[]> => {
        const response = await apiClient.get<T[]>(
            `campaigns/${campaignId}/targets/`
        )

        return response.data
    },

    /**
     * AUTH: Logs the user in and saves tokens.
     */
    login: async (credentials: any) => {
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
        const response = await apiClient.get('auth/me/')

        return response.data
    },

    /**
     * AUTH: Updates the current user's profile
     */
    updateMe: async (data: any) => {
        const response = await apiClient.patch('auth/me/', data)

        return response.data
    },

    changePassword: async (data: any) => {
        const response = await apiClient.post('auth/change-password/', data)

        return response.data
    },

    /**
     * AUTH: Logs the user out.
     */
    logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
    },

    /**
     * READ SINGLETON: Fetches a single object resource that doesn't use an ID (like settings)
     */
    getSingleton: async <T>(resource: string): Promise<T> => {
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
        const response = await apiClient.request<T>({
            url: `${resource}/`,
            method: method,
            data: data,
        })

        return response.data
    },

    /**
     * GENERIC FILE UPLOAD: Uploads a file using FormData
     * @param endpoint The full endpoint path (e.g., 'courses/1/upload-thumbnail/')
     * @param formData The FormData object containing the file
     */
    uploadFile: async <T>(endpoint: string, formData: FormData): Promise<T> => {
        const response = await apiClient.post<T>(endpoint, formData, {
            headers: {
                // Axios will usually set the boundary automatically for FormData,
                // but explicitly setting the content type is standard practice.
                'Content-Type': 'multipart/form-data',
            },
        })

        return response.data
    },

    uploadCsv: async (campaignId: string | number, file: File) => {
        const formData = new FormData()
        formData.append('csv_file', file)

        const response = await apiClient.post(
            `/campaigns/${campaignId}/targets/upload_csv/`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        )

        return response.data
    },

    getCampaignSmtp: async (id: number) => {
        const response = await apiClient.get(`campaigns/${id}/smtp/`)

        return response.data
    },

    updateCampaignSmtp: async (id: number, smtpData: any) => {
        const response = await apiClient.patch(
            `campaigns/${id}/smtp/`,
            smtpData
        )

        return response.data
    },

    getLMSSession: async (token: string, courseId?: string | number) => {
        const response = await apiClient.post('lms/session/', {
            token: token,
            course_id: courseId,
        })
        return response.data
    },

    getLMSProgress: async (lessonId: number, token: string) => {
        const response = await apiClient.get(
            `lms/lessons/${lessonId}/complete/?token=${token}`
        )

        return response.data
    },

    completeLMSLesson: async (lessonId: number, token: string) => {
        const response = await apiClient.post(
            `lms/lessons/${lessonId}/complete/`,
            {
                token: token,
            }
        )
        return response.data
    },

    getQuizAttempt: async (quizId: number | string, token: string) => {
        const response = await apiClient.get(
            `lms/quiz/${quizId}/submit/?token=${token}`
        )
        return response.data
    },

    submitQuizAttempt: async (
        quizId: number,
        token: string,
        answers: Record<string, number[]>
    ) => {
        const response = await apiClient.post(`lms/quiz/${quizId}/submit/`, {
            token: token,
            answers: answers,
        })
        return response.data
    },
}
