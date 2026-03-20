import { useEffect, useState } from 'react'
import Message from '../../components/Message.tsx'
import CourseCard from '../../components/CourseCard.tsx'
import type { Course } from '../../types/models.ts'
import { apiService } from '../../services/userService.ts'

function Courses() {
    const [data, setData] = useState<Course[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                setIsLoading(true)
                const fetchedData = await apiService.getAll<Course>('courses')
                setData(fetchedData)
            } catch (err) {
                console.error('Failed to load courses:', err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchCourses()
    }, [])

    return (
        <div className="flex flex-col items-start m-8">
            <Message text="Courses" />

            {/* Cards Container */}
            <div className="flex flex-row flex-wrap justify-center gap-[32px] drop-shadow-md">
                {data.map((item, index) => (
                    <CourseCard
                        title={item.title}
                        caption={item.caption}
                        key={index}
                    />
                ))}
            </div>
        </div>
    )
}

export default Courses
