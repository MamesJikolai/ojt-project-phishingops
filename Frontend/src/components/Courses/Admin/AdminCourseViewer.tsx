import { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import DefaultButton from '../../DefaultButton'
import CourseDetailsInput from '../CourseDetailsInput'
import CourseDetailsField from '../CourseDetailsField'
import AdminLessonCard from './AdminLessonCard'
import { useCourseData } from '../../../hook/useCourseData'
import { apiService } from '../../../services/userService'
import type { Course, Lesson, Quiz } from '../../../types/models'
import QuizModal from '../QuizModal'

const getLessonSortId = (lesson: any) => lesson.id?.toString() || lesson._tempId

function AdminCourseViewer({ role }: { role: string }) {
    const { courseId } = useParams<{ courseId: string }>()
    const navigate = useNavigate()

    const { course, setCourse, isLoading, fetchCourse } = useCourseData(
        courseId,
        role
    )
    const [openLessonIndex, setOpenLessonIndex] = useState<number | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
    const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null)

    const openCreateModal = useCallback(() => {
        setModalMode('create')
        setSelectedQuiz(null)
        setIsModalOpen(true)
    }, [])

    const openEditModal = useCallback((quizData: Quiz) => {
        setModalMode('edit')
        setSelectedQuiz(quizData)
        setIsModalOpen(true)
    }, [])

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

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

            // Refetch to get the new thumbnail URL
            await fetchCourse()

            // Refetch the fully serialized course object to get the correct URL!
            await fetchCourse()

            alert('Thumbnail uploaded successfully!')
        } catch (err: any) {
            console.error('Failed to upload thumbnail:', err)
            const errorMessage =
                err.response?.data?.error || 'Upload failed. Please try again.'
            alert(errorMessage)
        } finally {
            setIsUploading(false)
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

    const handleCreateNewLesson = () => {
        setHasUnsavedChanges(true)

        setCourse((prevCourse) => {
            if (!prevCourse) return prevCourse

            // Add a temp ID and append order for dnd-kit
            const newBlankLesson = {
                title: 'New Lesson',
                description: '',
                video_url: '',
                order: prevCourse.lessons?.length || 0,
                _tempId: `new-${Date.now()}`,
            }

            return {
                ...prevCourse,
                lessons: [...(prevCourse.lessons || []), newBlankLesson as any],
            }
        })

        setOpenLessonIndex(course?.lessons?.length || 0)
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            setCourse((prevCourse) => {
                if (!prevCourse || !prevCourse.lessons) return prevCourse

                const oldIndex = prevCourse.lessons.findIndex(
                    (l) => getLessonSortId(l) === active.id
                )
                const newIndex = prevCourse.lessons.findIndex(
                    (l) => getLessonSortId(l) === over.id
                )

                let updatedLessons = arrayMove(
                    prevCourse.lessons,
                    oldIndex,
                    newIndex
                )

                // Enforce proper backend ordering based on their new visual index
                updatedLessons = updatedLessons.map((lesson, index) => ({
                    ...lesson,
                    order: index,
                }))

                return { ...prevCourse, lessons: updatedLessons }
            })
            setHasUnsavedChanges(true)
        }
    }

    const handleSaveDetails = async () => {
        if (!courseId || !course) return

        setIsSaving(true)
        try {
            await apiService.update<Course>('courses', Number(courseId), {
                title: course.title,
                description: course.description,
            })

            if (course.lessons && course.lessons.length > 0) {
                const lessonPromises = course.lessons.map((lesson) => {
                    // Send over the updated `order` property
                    if (lesson.id) {
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
            alert(
                error.response?.data?.error || 'An unexpected error occurred.'
            )
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) return <div className="p-8">Loading course details...</div>
    if (!course) return <div className="p-8">Course not found.</div>

    return (
        <div className="flex flex-col items-start gap-4 p-4 md:p-8 w-full">
            <div className="flex flex-row justify-between w-full">
                <DefaultButton
                    onClick={() => navigate('/courses')}
                    className="bg-[#024C89] hover:bg-[#3572A1] text-[#F8F9FA] self-start"
                >
                    Go Back
                </DefaultButton>

                {role === 'admin' && (
                    <DefaultButton
                        onClick={handleDeleteCourse}
                        className="bg-[#DC3545] hover:bg-[#FF6B6B] text-[#F8F9FA] self-start"
                    >
                        Delete
                    </DefaultButton>
                )}
            </div>

            {!course.thumbnail || course.thumbnail.trim() === '' ? (
                <div className="bg-gradient-to-br from-[#3572A1] to-[#024C89] w-full h-[200px] md:h-[400px]"></div>
            ) : (
                <img
                    src={course.thumbnail || undefined}
                    alt={course.title}
                    className="w-full h-[200px] md:h-[400px] object-cover"
                />
            )}

            <CourseDetailsInput
                label={isUploading ? 'Uploading...' : 'Thumbnail'}
                type="file"
                disabled={isUploading}
                accept="image/png, image/jpeg, image/webp, .png, .jpg, .jpeg, .webp"
                onChange={(e) => {
                    const selectedFile = e.target.files?.[0]
                    if (selectedFile) {
                        handleUpload(selectedFile)
                    }
                }}
            />

            <CourseDetailsInput
                type="text"
                value={course?.title}
                onChange={(e) => {
                    setCourse((prev) =>
                        prev ? { ...prev, title: e.target.value } : prev
                    )
                    setHasUnsavedChanges(true)
                }}
                className="font-bold text-4xl text-[#121212] w-full"
            />

            <CourseDetailsField
                value={course?.description}
                onChange={(e) => {
                    setCourse((prev) =>
                        prev ? { ...prev, description: e.target.value } : prev
                    )
                    setHasUnsavedChanges(true)
                }}
                className="w-full"
                rows={8}
            />

            <div className="flex flex-col gap-4 w-full">
                {/* Drag and Drop Context Wrappers */}
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={course?.lessons?.map(getLessonSortId) || []}
                        strategy={verticalListSortingStrategy}
                    >
                        {course?.lessons?.map((item, index) => (
                            <AdminLessonCard
                                key={getLessonSortId(item)} // Critical: Use the stable ID as key
                                sortableId={getLessonSortId(item)}
                                item={item}
                                index={index}
                                isOpen={openLessonIndex === index}
                                onToggle={() =>
                                    setOpenLessonIndex(
                                        openLessonIndex === index ? null : index
                                    )
                                }
                                onLessonChange={handleLessonChange}
                                onLessonDelete={handleDeleteLesson}
                            />
                        ))}
                    </SortableContext>
                </DndContext>
            </div>

            <DefaultButton
                onClick={handleCreateNewLesson}
                className="text-[#024C89] text-[24px] border-2 border-[#024C89] hover:bg-[#024C89] hover:text-[#F8F9FA] w-full !py-1"
            >
                +
            </DefaultButton>

            <DefaultButton
                children={course?.quiz ? 'Edit Quiz' : 'Add Quiz'}
                onClick={() => {
                    // If a quiz exists, open in Edit Mode and pass the existing data
                    if (course?.quiz) {
                        openEditModal(course.quiz)
                    } else {
                        // Otherwise, open a blank Create Mode modal
                        openCreateModal()
                    }
                }}
                className="bg-[#024C89] hover:bg-[#3572A1] text-[#F8F9FA] w-full !py-3"
            />

            {hasUnsavedChanges && (
                <DefaultButton
                    onClick={handleSaveDetails}
                    disabled={isSaving}
                    className="bg-[#024C89] hover:bg-[#3572A1] text-[#F8F9FA] self-end"
                >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </DefaultButton>
            )}

            {isModalOpen && (
                <QuizModal
                    key={selectedQuiz ? selectedQuiz.id : 'create-modal'}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    mode={modalMode}
                    initialData={selectedQuiz}
                    courseId={courseId}
                    onSaveComplete={fetchCourse}
                />
            )}
        </div>
    )
}

export default AdminCourseViewer
