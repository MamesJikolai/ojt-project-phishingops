import { useState, useEffect, useCallback, useRef } from 'react'
import { apiService } from '../services/userService'
import type { Course } from '../types/models'

export function useCourseData(courseId: string | undefined, role: string) {
    const [course, setCourse] = useState<Course | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [showQuiz, setShowQuiz] = useState(false)

    const alertShownRef = useRef(false)

    const fetchCourse = useCallback(async () => {
        if (!courseId) return
        setIsLoading(true)
        try {
            if (role === 'public') {
                const token = localStorage.getItem('lms_token')

                if (token) {
                    // Normal employee flow with tracking
                    const data = await apiService.getLMSSession(token, courseId)
                    setCourse(data.course)
                    if (data.progress?.all_complete) setShowQuiz(true)
                } else {
                    // Developer / Preview flow (No tracking)
                    console.warn(
                        'No LMS token found. Fetching generic course preview.'
                    )

                    if (!alertShownRef.current) {
                        alert(
                            'Your progress will not be saved in this mode. Please use the email link to track your progress and access the quiz.'
                        )
                        alertShownRef.current = true
                    }

                    const data = await apiService.getOne<Course>(
                        'courses',
                        courseId
                    )
                    setCourse(data)
                }
            } else {
                // Admin flow
                const data = await apiService.getOne<Course>(
                    'courses',
                    courseId
                )
                setCourse(data)
            }
        } catch (err) {
            console.error('Failed to load course details:', err)
        } finally {
            setIsLoading(false)
        }
    }, [courseId, role])

    useEffect(() => {
        fetchCourse()
    }, [fetchCourse])

    return { course, setCourse, isLoading, showQuiz, setShowQuiz, fetchCourse }
}
