import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiService } from '../services/userService'
import type { Course, Lesson } from '../types/models'
import DefaultButton from '../components/DefaultButton'
import Message from '../components/Message'
import LessonCard from '../components/Courses/LessonCard'
import CourseDetailsInput from '../components/Courses/CourseDetailsInput'
import CourseDetailsField from '../components/Courses/CourseDetailsField'

function CourseDetail() {
    const { user } = useAuth()
    const role = user?.role?.toLowerCase() || 'public'

    const { courseId } = useParams<{ courseId: string }>()
    const navigate = useNavigate()

    const [course, setCourse] = useState<Course | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [openLessonIndex, setOpenLessonIndex] = useState<number | null>(null)

    const [file, setFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [editTitle, setEditTitle] = useState('')
    const [editDescription, setEditDescription] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

    const fetchCourse = async () => {
        if (!courseId) return
        try {
            const data = await apiService.getOne<Course>('courses', courseId)
            setCourse(data)
        } catch (err) {
            console.error('Failed to load course details:', err)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (course) {
            setEditTitle(course.title)
            setEditDescription(course.description)
        }
    }, [course])

    useEffect(() => {
        fetchCourse()
    }, [courseId])

    const handleUpload = async (fileToUpload: File) => {
        if (!fileToUpload || !courseId) return

        setIsUploading(true)
        try {
            const formData = new FormData()
            formData.append('thumbnail', fileToUpload)

            // Send the upload request
            await apiService.uploadFile(
                `courses/${courseId}/upload-thumbnail/`,
                formData
            )

            // Refetch the fully serialized course object to get the correct URL!
            await fetchCourse()

            // Optional: Show a success message
            alert('Thumbnail uploaded successfully!')
        } catch (err) {
            console.error('Failed to upload thumbnail:', err)
            alert('Upload failed. Please try again.')
        } finally {
            setIsUploading(false)
            setFile(null)
        }
    }

    const handleCreateNewLesson = () => {
        setHasUnsavedChanges(true) // Turn on the save button

        setCourse((prevCourse) => {
            if (!prevCourse) return prevCourse

            // Create a blank template lesson
            const newBlankLesson: Partial<Lesson> = {
                title: 'New Lesson',
                description: '',
                video_url: '',
                // Note: It does NOT have an 'id' yet! That's important.
            }

            return {
                ...prevCourse,
                lessons: [
                    ...(prevCourse.lessons || []),
                    newBlankLesson as Lesson,
                ],
            }
        })

        // Optional: Automatically open the new accordion panel
        // If length was 2, the new index is 2
        setOpenLessonIndex(course?.lessons?.length || 0)
    }

    const handleSaveDetails = async () => {
        if (!courseId || !course) return

        setIsSaving(true)
        try {
            await apiService.update<Course>('courses', Number(courseId), {
                title: editTitle,
                description: editDescription,
            })

            if (course.lessons && course.lessons.length > 0) {
                const lessonPromises = course.lessons.map((lesson) => {
                    if (lesson.id) {
                        // Update existing lesson (PATCH)
                        return apiService.update(
                            `courses/${courseId}/lessons`,
                            lesson.id,
                            lesson,
                            'PATCH'
                        )
                    } else {
                        return apiService.create(
                            `courses/${courseId}/lessons`,
                            {
                                ...lesson,
                            }
                        )
                    }
                })
                await Promise.all(lessonPromises)
            }

            await fetchCourse()
            setHasUnsavedChanges(false)
            alert('Course and all lessons saved successfully!')
        } catch (error: any) {
            if (error.response?.data?.error) {
                alert(error.response.data.error)
            } else {
                alert('An unexpected error occurred. Please try again.')
            }
        } finally {
            setIsSaving(false)
        }
    }

    const handleLessonChange = (
        lessonIndex: number,
        field: keyof Lesson,
        value: string
    ) => {
        setHasUnsavedChanges(true) // Show the save button
        setCourse((prevCourse) => {
            if (!prevCourse) return prevCourse

            // Create a copy of the lessons array
            const updatedLessons = [...(prevCourse.lessons || [])]
            // Update the specific field of the specific lesson
            updatedLessons[lessonIndex] = {
                ...updatedLessons[lessonIndex],
                [field]: value,
            }

            return { ...prevCourse, lessons: updatedLessons }
        })
    }

    const handleDeleteCourse = async () => {
        // Make sure we actually have a course loaded
        if (!course || !course.id) return

        // Ask for confirmation
        const confirmDelete = window.confirm(
            `Are you sure you want to delete "${course.title}"?`
        )

        if (confirmDelete) {
            try {
                // Delete from the backend
                await apiService.delete('courses', course.id)

                // Send the user back to the main courses page!
                navigate('/courses')
            } catch (err) {
                console.error('Failed to delete course:', err)
                alert('Failed to delete the course. Please try again.')
            }
        }
    }

    const handleDeleteLesson = async (indexToDelete: number) => {
        if (!course || !courseId) return

        const lessonToDelete = course.lessons?.[indexToDelete]
        if (!lessonToDelete) return

        const confirmDelete = window.confirm(
            `Are you sure you want to delete the lesson "${lessonToDelete.title}"?`
        )

        if (confirmDelete) {
            // If it has an ID, delete it from the backend
            if (lessonToDelete.id) {
                try {
                    await apiService.delete(
                        `courses/${courseId}/lessons`,
                        lessonToDelete.id
                    )
                } catch (err) {
                    console.error('Failed to delete lesson from server:', err)
                    alert('Failed to delete lesson. Please try again.')
                    return
                }
            }

            setCourse((prevCourse) => {
                if (!prevCourse) return prevCourse
                const updatedLessons = prevCourse.lessons?.filter(
                    (_, i) => i !== indexToDelete
                )
                return { ...prevCourse, lessons: updatedLessons }
            })

            if (openLessonIndex === indexToDelete) {
                setOpenLessonIndex(null)
            }
        }
    }

    if (isLoading) return <div className="p-8">Loading course details...</div>
    if (!course) return <div className="p-8">Course not found.</div>

    return (
        <div className="flex flex-col items-start gap-4 m-8">
            {/* Back Button */}
            {(role === 'hr' || role === 'admin') && (
                <div className="flex flex-row justify-between w-full">
                    <DefaultButton
                        onClick={() => navigate('/courses')}
                        className="bg-[#024C89] hover:bg-[#3572A1] text-[#F8F9FA] self-start mb-4"
                    >
                        Go Back
                    </DefaultButton>

                    {role === 'admin' && (
                        <DefaultButton
                            onClick={handleDeleteCourse}
                            className="bg-[#DC3545] hover:bg-[#FF6B6B] text-[#F8F9FA] self-start mb-4"
                        >
                            Delete
                        </DefaultButton>
                    )}
                </div>
            )}
            {role === 'public' && (
                <div>
                    <DefaultButton
                        onClick={() => navigate('/home')}
                        className="bg-[#024C89] hover:bg-[#3572A1] text-[#F8F9FA] self-start mb-4"
                    >
                        Go Back
                    </DefaultButton>
                </div>
            )}

            {/* Thumbnail */}
            {!course.thumbnail || course.thumbnail.trim() === '' ? (
                <div className="bg-gradient-to-br from-[#3572A1] to-[#024C89] w-full h-[400px]"></div>
            ) : (
                <img
                    src={course.thumbnail || undefined}
                    alt={course.title}
                    className="w-full h-[400px] object-cover"
                />
            )}

            {/* Thumbnail Upload */}
            {role === 'admin' && (
                <CourseDetailsInput
                    label="Upload Thumbnail"
                    type="file"
                    accept="image/png, image/jpeg, image/webp, .png, .jpg, .jpeg, .webp"
                    onChange={(e) => {
                        const selectedFile = e.target.files?.[0]
                        if (selectedFile) {
                            setFile(selectedFile) // Keep this if you want to show the file name in the UI later
                            handleUpload(selectedFile) // Pass it directly!
                        }
                    }}
                    className="w-full cursor-pointer"
                />
            )}

            {/* Course Details */}
            {role === 'admin' ? (
                <>
                    <CourseDetailsInput
                        type="text"
                        value={editTitle}
                        onChange={(e) => {
                            setEditTitle(e.target.value)
                            setHasUnsavedChanges(true)
                        }}
                        className="font-bold text-4xl text-[#121212] w-full"
                    />
                    <CourseDetailsField
                        value={editDescription}
                        onChange={(e) => {
                            setEditDescription(e.target.value)
                            setHasUnsavedChanges(true)
                        }}
                        className="w-full"
                        rows={8}
                    />
                </>
            ) : (
                <>
                    <Message text={course.title} />
                    <p className="text-justify whitespace-pre-wrap mb-4">
                        {course.description}
                    </p>
                </>
            )}

            {/* Lesson Cards */}
            <div className="flex flex-col gap-4 w-full">
                {course.lessons?.map((item, index) => (
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
                        role={role}
                        onLessonChange={handleLessonChange}
                        onLessonDelete={handleDeleteLesson}
                    />
                ))}
            </div>

            {/* Add Lesson Button */}
            {role === 'admin' && (
                <DefaultButton
                    onClick={handleCreateNewLesson}
                    className="text-[#024C89] text-[32px] border-2 border-[#024C89] hover:bg-[#024C89] hover:text-[#F8F9FA] w-full !py-1"
                >
                    +
                </DefaultButton>
            )}

            {/* Save Changes Button */}
            {role === 'admin' && hasUnsavedChanges && (
                <DefaultButton
                    onClick={handleSaveDetails}
                    disabled={isSaving}
                    className="bg-[#024C89] hover:bg-[#3572A1] text-[#F8F9FA] self-end"
                >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </DefaultButton>
            )}
        </div>
    )
}

export default CourseDetail
