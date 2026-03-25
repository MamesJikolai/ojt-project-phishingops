import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiService } from '../services/userService'
import type { Course } from '../types/models'
import DefaultButton from '../components/DefaultButton'
import Message from '../components/Message'
import LessonCard from '../components/Courses/LessonCard'
import TextInput from '../components/TextInput'

function CourseDetail() {
    const { courseId } = useParams<{ courseId: string }>()
    const navigate = useNavigate()

    const { user } = useAuth()
    const role = user?.role?.toLowerCase() || 'public'

    const [course, setCourse] = useState<Course | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [openLessonIndex, setOpenLessonIndex] = useState<number | null>(null)

    useEffect(() => {
        if (!courseId) return

        const fetchCourse = async () => {
            try {
                // Assuming your apiService has a getOne method
                const data = await apiService.getOne<Course>(
                    'courses',
                    courseId
                )
                setCourse(data)
            } catch (err) {
                console.error('Failed to load course details:', err)
            } finally {
                setIsLoading(false)
            }
        }
        if (courseId) fetchCourse()
    }, [courseId])

    if (isLoading) return <div className="p-8">Loading course details...</div>
    if (!course) return <div className="p-8">Course not found.</div>

    return (
        <div className="flex flex-col items-start m-8">
            {(role === 'hr' || role === 'admin') && (
                <DefaultButton
                    onClick={() => navigate('/courses')}
                    className="bg-[#024C89] hover:bg-[#3572A1] text-[#F8F9FA] self-start mb-8"
                >
                    Go Back
                </DefaultButton>
            )}
            {role === 'public' && (
                <div>
                    <DefaultButton
                        onClick={() => navigate('/home')}
                        className="bg-[#024C89] hover:bg-[#3572A1] text-[#F8F9FA] self-start mb-8"
                    >
                        Go Back
                    </DefaultButton>
                </div>
            )}

            {!course.thumbnail ? (
                <div className="bg-gradient-to-br from-[#3572A1] to-[#024C89] w-full h-[400px]"></div>
            ) : (
                <img
                    src={course.thumbnail}
                    alt={course.thumbnail}
                    className="w-full h-[400px] object-cover"
                />
            )}

            <TextInput
                label="Upload Thumbnail"
                type="file"
                accept="image/png, image/jpeg, image/webp, .png, .jpg, .jpeg, .webp"
                // onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full cursor-pointer"
            />

            <Message text={course.title} subtitle={course.created_at} />
            <p className="text-justify whitespace-pre-wrap mb-8">
                {course.description}
            </p>

            <div className="flex flex-col gap-4 w-full">
                {course.lessons.map((item, index) => (
                    <LessonCard
                        key={index}
                        item={item}
                        index={index}
                        isOpen={openLessonIndex === index}
                        onToggle={() =>
                            setOpenLessonIndex(
                                openLessonIndex === index ? null : index
                            )
                        }
                    />
                ))}
            </div>
        </div>
    )
}

export default CourseDetail
