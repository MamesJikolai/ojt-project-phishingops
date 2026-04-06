import { useEffect, useState, useCallback } from 'react'
import Message from '../../components/Message.tsx'
import CourseCard from '../../components/Courses/CourseCard.tsx'
import DefaultButton from '../../components/DefaultButton.tsx'
import type { Course } from '../../types/models.ts'
import { apiService } from '../../services/userService.ts'
import { useAuth } from '../../context/AuthContext.tsx'
import CourseModal from '../../components/Courses/CourseModal.tsx'

function Courses() {
    // Grab the logged-in user directly from context
    const { user } = useAuth()
    const userRole = user?.role || ''

    const [data, setData] = useState<Course[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

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

    const openCreateModal = useCallback(() => {
        setSelectedCourse(null)
        setIsModalOpen(true)
    }, [])

    const handleDeleteCourse = useCallback(async (courseData: Course) => {
        const confirmDelete = window.confirm(
            `Are you sure you want to delete "${courseData.title}"?`
        )
        if (confirmDelete) {
            try {
                await apiService.delete('courses', courseData.id)
                setData((prev: Course[]) =>
                    prev.filter((item) => item.id !== courseData.id)
                )
            } catch (err) {
                console.error('Failed to delete course:', err)
            }
        }
    }, [])

    const handleSaveCourse = async (courseData: Course) => {
        try {
            const newCourse = await apiService.create<Course>(
                'courses',
                courseData
            )
            setData((prevData: Course[]) => [newCourse, ...prevData])
        } catch (err) {
            console.error('Failed to save course:', err)
        }
    }

    const handlePublishCourse = async (courseData: Course) => {
        try {
            const updatedPublish = await apiService.update<Course>(
                'courses',
                courseData.id,
                { is_published: !courseData.is_published },
                'PATCH'
            )

            setData((prev: Course[]) =>
                prev.map((item) =>
                    item.id === updatedPublish.id ? updatedPublish : item
                )
            )
        } catch (err) {
            console.error('Failed to publish course:', err)
        }
    }

    return (
        <div className="flex flex-col items-start p-4 md:p-8 w-full">
            <div className="flex justify-between items-center w-full">
                <Message text="Courses" />

                {userRole !== 'hr' && (
                    <DefaultButton
                        className="bg-[#024C89] hover:bg-[#3572A1] text-[#F8F9FA]"
                        onClick={openCreateModal}
                        children="Create Course"
                    />
                )}
            </div>

            {/* Cards Container */}
            {isLoading ? (
                <div className="py-8 text-gray-500 animate-pulse">
                    Loading Courses...
                </div>
            ) : (
                <div className="flex flex-row flex-wrap justify-center gap-x-8 gap-y-4 lg:gap-y-8 drop-shadow-md">
                    {data.map((item) => (
                        <CourseCard
                            item={item}
                            key={item.id}
                            handleDeleteCourse={() => handleDeleteCourse(item)}
                            handlePublishCourse={() =>
                                handlePublishCourse(item)
                            }
                        />
                    ))}
                </div>
            )}

            {isModalOpen && (
                <CourseModal
                    key={selectedCourse ? selectedCourse.id : 'create-modal'}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveCourse}
                />
            )}
        </div>
    )
}

export default Courses
