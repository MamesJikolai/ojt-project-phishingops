import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DefaultButton from '../../DefaultButton'
import Message from '../../Message'
import PublicLessonCard from './PublicLessonCard'
import { useCourseData } from '../../../hook/useCourseData'
import { apiService } from '../../../services/userService'
import type { QuizPublic } from '../../../types/models'
import PublicQuizModal from './PublicQuizModal'

function PublicCourseViewer({ role }: { role: string }) {
    const { courseId } = useParams<{ courseId: string }>()
    const navigate = useNavigate()

    const { course, showQuiz, setShowQuiz } = useCourseData(courseId, role)
    const [openLessonIndex, setOpenLessonIndex] = useState<number | null>(null)

    const [quizScore, setQuizScore] = useState<number>(0)
    const [attemptsCount, setAttemptsCount] = useState<number>(0)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedQuiz, setSelectedQuiz] = useState<QuizPublic | null>(null)

    const openQuizModal = useCallback((quizData: QuizPublic) => {
        setSelectedQuiz(quizData)
        setIsModalOpen(true)
    }, [])

    const handleLessonCompleted = useCallback(
        async (lessonId: number) => {
            if (!courseId) return
            if (role !== 'public') return // Only track progress for actual employees

            const token = localStorage.getItem('lms_token')

            if (!token) {
                console.warn(
                    'No LMS token found in storage. Cannot save progress.'
                )
                return
            }

            try {
                const response = await apiService.completeLMSLesson(
                    lessonId,
                    token
                )
                console.log(`Lesson ${lessonId} progress saved!`, response)

                if (response.all_lessons_done) {
                    alert(
                        'Congratulations! You have completed all lessons for this course. You can now take the short quiz to test your knowledge!'
                    )
                    setShowQuiz(true)
                }
            } catch (err) {
                console.error('Failed to save lesson progress:', err)
            }
        },
        [courseId, role]
    )

    useEffect(() => {
        const fetchQuizData = async () => {
            const quizId = course?.quiz?.id

            if (showQuiz && role === 'public' && quizId) {
                const token = localStorage.getItem('lms_token')
                if (!token) return

                try {
                    const data = await apiService.getQuizAttempt(quizId, token)
                    if (data.quiz_attempt) {
                        setQuizScore(data.quiz_attempt.score)
                    }
                    setAttemptsCount(data.attempts_count || 0)
                } catch (err) {
                    console.error('Failed to fetch quiz attempts:', err)
                }
            }
        }

        fetchQuizData()
    }, [showQuiz, course, role])

    return (
        <div className="flex flex-col items-start gap-4 m-8">
            <DefaultButton
                onClick={() => navigate('/home')}
                className="bg-[#024C89] hover:bg-[#3572A1] text-[#F8F9FA] self-start mb-4"
            >
                Go Back
            </DefaultButton>

            {!course?.thumbnail || course?.thumbnail.trim() === '' ? (
                <div className="bg-gradient-to-br from-[#3572A1] to-[#024C89] w-full h-[400px]"></div>
            ) : (
                <img
                    src={course?.thumbnail || undefined}
                    alt={course?.title}
                    className="w-full h-[400px] object-cover"
                />
            )}

            <Message text={course?.title || 'Course Title'} />
            <p className="text-justify whitespace-pre-wrap mb-4">
                {course?.description}
            </p>

            <div className="flex flex-col gap-4 w-full">
                {course?.lessons?.map((item, index) => (
                    <PublicLessonCard
                        key={index}
                        item={item}
                        index={index}
                        isOpen={openLessonIndex === index}
                        onToggle={() =>
                            setOpenLessonIndex(
                                openLessonIndex === index ? null : index
                            )
                        }
                        onLessonCompleted={handleLessonCompleted}
                    />
                ))}
            </div>

            {showQuiz && (
                <div className="flex flex-row gap-4 items-center mt-4">
                    <DefaultButton
                        children="Start Quiz"
                        onClick={() => {
                            if (course?.quiz) {
                                openQuizModal(course.quiz as any)
                            }
                        }}
                        disabled={attemptsCount >= 3}
                        className="bg-[#024C89] hover:bg-[#3572A1] text-[#F8F9FA]"
                    />

                    <div className="flex items-center gap-2">
                        <span
                            className={`px-4 py-2 text-[20px] font-semibold rounded-full ${quizScore > 70 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                        >
                            {quizScore}%
                        </span>
                        <span className="px-4 py-2 bg-[#F8F9FA] rounded-full">
                            {attemptsCount} / 3 tries
                        </span>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <PublicQuizModal
                    key={selectedQuiz ? selectedQuiz.id : 'new-quiz'}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    initialData={selectedQuiz}
                    courseId={courseId}
                />
            )}
        </div>
    )
}

export default PublicCourseViewer
