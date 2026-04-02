import { useState } from 'react'
import type { QuizPublic } from '../../../types/models'
import DefaultButton from '../../DefaultButton'
import { apiService } from '../../../services/userService'
import TextInput from '../../TextInput'

interface PublicQuizModalProps {
    isOpen: boolean
    onClose: () => void
    initialData?: QuizPublic | null
    courseId?: string
    onSaveComplete?: () => void
}

function PublicQuizModal({
    isOpen,
    onClose,
    initialData,
    courseId,
    onSaveComplete,
}: PublicQuizModalProps) {
    const [answers, setAnswers] = useState<Record<number, number[]>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)

    if (!isOpen || !initialData) return null

    const handleSelectChoice = (
        questionId: number,
        choiceId: number,
        type: 'single' | 'multi'
    ) => {
        setAnswers((prev) => {
            if (type === 'single') {
                return { ...prev, [questionId]: [choiceId] }
            } else {
                const currentSelections = prev[questionId] || []
                if (currentSelections.includes(choiceId)) {
                    return {
                        ...prev,
                        [questionId]: currentSelections.filter(
                            (id) => id !== choiceId
                        ),
                    }
                } else {
                    return {
                        ...prev,
                        [questionId]: [...currentSelections, choiceId],
                    }
                }
            }
        })
    }

    const handleSubmit = async () => {
        const token = localStorage.getItem('lms_token')
        if (!token) {
            return alert(
                'Session token missing. Please reload the page via your email link.'
            )
        }

        const unanswered = initialData.questions.filter(
            (q) => !answers[q.id] || answers[q.id].length === 0
        )
        if (unanswered.length > 0) {
            return alert('Please answer all questions before submitting.')
        }

        setIsSubmitting(true)
        try {
            const result = await apiService.submitQuizAttempt(
                initialData.id,
                token,
                answers
            )

            // Show the result to the user!
            if (result.passed) {
                alert(
                    `Congratulations! You passed with a score of ${result.score}%`
                )
            } else {
                alert(
                    `You scored ${result.score}%. The passing score is ${result.passing_score}%. Please try again.`
                )
            }

            // Close the modal and optionally trigger a refresh
            onClose()
            window.location.reload() // Quick way to refresh the course viewer data
        } catch (error: any) {
            console.error('Failed to submit quiz:', error)
            alert(
                error.response?.data?.error ||
                    'Failed to submit quiz. Please try again.'
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <form className="flex flex-col gap-4 bg-[#F8F9FA] relative w-full max-w-2xl max-h-[90vh] px-[32px] py-[48px] overflow-y-auto rounded-xl drop-shadow-md">
                <DefaultButton
                    children="&times;"
                    type="button"
                    onClick={onClose}
                    className="absolute top-1 right-4 text-[#4A4A4A] hover:text-[#DC3545] text-3xl font-bold z-10 transition-colors"
                    aria-label="Close modal"
                />

                <div className="border-b border-[#4A4A4A] pb-6">
                    <h2 className="text-2xl font-bold text-[#121212]">
                        {initialData.title}
                    </h2>

                    {initialData.instructions && (
                        <p className="text-[#4A4A4A] mt-2 whitespace-pre-wrap">
                            {initialData.instructions}
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-8">
                    {initialData.questions.map((question, qIndex) => (
                        <div key={qIndex} className="flex flex-col gap-2">
                            <h3>
                                {qIndex + 1}. {question.text}{' '}
                                <span className="text-[16px] font-normal">
                                    (
                                    {question.question_type === 'single'
                                        ? 'Select one.'
                                        : 'Select all that apply.'}
                                    )
                                </span>
                            </h3>
                            <div className="flex flex-col gap-2">
                                {question.choices.map((choice, cIndex) => {
                                    const isSelected = (
                                        answers[question.id] || []
                                    ).includes(choice.id)
                                    return (
                                        <TextInput
                                            key={cIndex}
                                            label={choice.text}
                                            type={
                                                question.question_type ===
                                                'single'
                                                    ? 'radio'
                                                    : 'checkbox'
                                            }
                                            name={`question-${question.id}`}
                                            checked={isSelected}
                                            onChange={() =>
                                                handleSelectChoice(
                                                    question.id,
                                                    choice.id,
                                                    question.question_type
                                                )
                                            }
                                            className="w-5 h-5 cursor-pointer accent-[#024C89]"
                                        />
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-row gap-4 self-center">
                    <DefaultButton
                        children="Cancel"
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="bg-transparent border border-[#DC3545] text-[#DC3545] hover:bg-[#DC3545] hover:text-[#F8F9FA]"
                    />

                    <DefaultButton
                        children={
                            isSubmitting ? 'Submitting...' : 'Submit Quiz'
                        }
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-[#024C89] hover:bg-[#3572A1] text-[#F8F9FA]"
                    />
                </div>
            </form>
        </div>
    )
}

export default PublicQuizModal
