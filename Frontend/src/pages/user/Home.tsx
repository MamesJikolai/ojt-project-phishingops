import { useState, useEffect } from 'react'
import Message from '../../components/Message.tsx'
import CourseCard from '../../components/Courses/CourseCard.tsx'
import { Icons } from '../../assets/icons.ts'
import { NavLink } from 'react-router-dom'
import type { Course } from '../../types/models.ts'
import { apiService } from '../../services/userService.ts'

function Home() {
    const [data, setData] = useState<Course[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                setIsLoading(true)
                const fetchedData = await apiService.getAll<Course>('courses')
                const publishedCourses = fetchedData.filter(
                    (course) => course.is_published
                )
                setData(publishedCourses)
            } catch (err) {
                console.error('Failed to load courses:', err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchCourses()
    }, [])

    return (
        <>
            <div className="flex flex-col items-start p-8 overflow-x-hidden max-w-full min-h-screen">
                <Message text="Home" />

                {isLoading ? (
                    <div className="py-8 text-gray-500 animate-pulse">
                        Loading Courses...
                    </div>
                ) : (
                    <div className="flex flex-wrap justify-center w-full overflow-x-auto gap-4 pb-4">
                        {data.map((item, index) => (
                            <CourseCard
                                item={item}
                                key={item.id || index}
                                customCSS="drop-shadow-md"
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    )
}

export default Home
