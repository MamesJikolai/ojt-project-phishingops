import DefaultButton from '../DefaultButton'
import QuestionCards from './QuestionCards'
import TextInput from '../TextInput'
import TextField from '../TextField'
import type { Quiz } from '../../types/models'
import { useQuizSave } from '../../hook/useQuizSave'
import { useQuizState } from '../../hook/useQuizState'

interface QuizModalProps {
    isOpen: boolean
    onClose: () => void
    mode: 'create' | 'edit'
    initialData?: Quiz | null
    courseId?: string
    onSaveComplete: () => void
}

function QuizModal({
    isOpen,
    onClose,
    mode,
    initialData,
    courseId,
    onSaveComplete,
}: QuizModalProps) {
    // 1. Bring in the state logic
    const {
        quizState,
        deletedQuestions,
        deletedChoices,
        handleQuizChange,
        addQuestion,
        updateQuestion,
        removeQuestion,
        addChoice,
        updateChoice,
        removeChoice,
    } = useQuizState(mode, initialData)

    // 2. Bring in the save logic
    const { isSaving, saveQuiz } = useQuizSave(courseId)

    // 3. Simple trigger function
    const onSaveClick = () => {
        saveQuiz(mode, quizState, deletedQuestions, deletedChoices, () => {
            onSaveComplete()
            onClose()
        })
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="flex flex-col gap-2 bg-[#F8F9FA] relative w-full max-w-2xl max-h-[90vh] px-[32px] py-[48px] overflow-y-auto rounded-xl drop-shadow-md">
                <DefaultButton
                    children="&times;"
                    type="button"
                    onClick={onClose}
                    className="absolute top-1 right-4 text-[#4A4A4A] hover:text-[#DC3545] text-3xl font-bold z-10 transition-colors"
                    aria-label="Close modal"
                />

                <h2>{mode === 'create' ? 'Create Quiz' : 'Edit Quiz'}</h2>

                {/* Quiz Details */}
                <div className="flex flex-col gap-4 border-b pb-6">
                    <TextInput
                        label="Quiz Title"
                        type="text"
                        placeholder="e.g., Phishing Awareness Basics"
                        value={quizState.title}
                        onChange={(e) =>
                            handleQuizChange('title', e.target.value)
                        }
                        className="w-full"
                    />

                    <TextInput
                        label="Passing Score (%)"
                        type="number"
                        placeholder="e.g., 80"
                        value={quizState.passing_score}
                        onChange={(e) =>
                            handleQuizChange(
                                'passing_score',
                                Number(e.target.value)
                            )
                        }
                        className="w-full"
                        min={0}
                        max={100}
                    />

                    <TextField
                        label="Quiz Instructions"
                        placeholder="Instructions for the user..."
                        value={quizState.instructions}
                        onChange={(e) =>
                            handleQuizChange('instructions', e.target.value)
                        }
                        className="w-full"
                        rows={5}
                    />
                </div>

                {/* Quiz Questions */}
                <div className="flex flex-col gap-4 border-b pb-6">
                    <h3>Questions</h3>

                    {quizState.questions.map((question, qIndex) => (
                        <QuestionCards
                            qIndex={qIndex}
                            question={question}
                            removeQuestion={removeQuestion}
                            updateQuestion={updateQuestion}
                            addChoice={addChoice}
                            updateChoice={updateChoice}
                            removeChoice={removeChoice}
                        />
                    ))}

                    <DefaultButton
                        children="Add Question"
                        type="button"
                        onClick={addQuestion}
                        className="border-2 border-[#024C89] text-[#024C89] hover:bg-[#024C89] hover:text-[#F8F9FA]"
                    />
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-4 pt-4">
                    <DefaultButton
                        children="Cancel"
                        onClick={onClose}
                        disabled={isSaving}
                        className="bg-[#DC3545] hover:bg-[#FF6B6B] text-[#F8F9FA]"
                    />
                    <DefaultButton
                        children={
                            mode === 'create' ? 'Create Quiz' : 'Update Quiz'
                        }
                        onClick={onSaveClick}
                        disabled={isSaving}
                        className="bg-[#024C89] hover:bg-[#3572A1] text-[#F8F9FA]"
                    />
                </div>
            </div>
        </div>
    )
}

export default QuizModal
