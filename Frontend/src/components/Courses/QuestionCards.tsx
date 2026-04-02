import TextField from '../TextField'
import DefaultButton from '../DefaultButton'
import type { QuizChoices, QuizQuestions } from '../../types/models'
import TextInput from '../TextInput'

interface QuestionCardsProps {
    qIndex: number
    question: QuizQuestions
    removeQuestion: (index: number) => void
    updateQuestion: (
        index: number,
        field: keyof QuizQuestions,
        value: any
    ) => void
    addChoice: (index: number) => void
    updateChoice: (
        qIndex: number,
        cIndex: number,
        field: keyof QuizChoices,
        value: any
    ) => void
    removeChoice: (qIndex: number, cIndex: number) => void
}

function QuestionCards({
    qIndex,
    question,
    removeQuestion,
    updateQuestion,
    addChoice,
    updateChoice,
    removeChoice,
}: QuestionCardsProps) {
    return (
        <div
            key={qIndex}
            className="bg-[#E6EDF3] p-4 rounded-md border shadow-sm flex flex-col gap-4"
        >
            {/* Question Header */}
            <div className="flex justify-between items-center">
                <span className="font-bold text-[#024C89]">
                    Question {qIndex + 1}
                </span>
                <button
                    onClick={() => removeQuestion(qIndex)}
                    className="text-sm text-[#DC3545] hover:underline cursor-pointer"
                >
                    Remove Question
                </button>
            </div>

            {/* Question Details */}
            <div className="flex gap-4">
                {/* Question Text */}
                <div className="flex-1">
                    <TextField
                        label="Question Text"
                        placeholder="Enter your question here..."
                        value={question.text}
                        onChange={(e) =>
                            updateQuestion(qIndex, 'text', e.target.value)
                        }
                        className="w-full border! border-[#4A4A4A]! rounded-sm! bg-[#E6EDF3]!"
                        rows={2}
                    />
                </div>

                {/* Question Type */}
                <div className="w-48">
                    <label className="block text-sm font-medium mb-2">
                        Type
                    </label>
                    <select
                        className="w-full border border-[#4A4A4A] rounded p-2 text-sm"
                        value={question.question_type}
                        onChange={(e) =>
                            updateQuestion(
                                qIndex,
                                'question_type',
                                e.target.value
                            )
                        }
                    >
                        <option value="single">Single Choice</option>
                        <option value="multi">Multiple Choice</option>
                    </select>
                </div>
            </div>

            {/* Explanation */}
            <TextField
                label="Explanation (optional)"
                placeholder="Explain the correct answer..."
                value={question.explanation || ''}
                onChange={(e) =>
                    updateQuestion(qIndex, 'explanation', e.target.value)
                }
                rows={3}
                className="w-full border! border-[#4A4A4A]! rounded-sm! bg-[#E6EDF3]!"
            />

            {/* Question Choices and Answer(s) */}
            <div className="pl-4 border-l-4 border-[#3572A1] mt-2 flex flex-col gap-3">
                <p className="text-sm font-semibold text-[#4A4A4A]">
                    Answers (Check the correct ones)
                </p>

                {question.choices.map((choice, cIndex) => (
                    <div key={cIndex} className="flex items-center gap-3">
                        <TextInput
                            type={
                                question.question_type === 'single'
                                    ? 'radio'
                                    : 'checkbox'
                            }
                            name={`question-${qIndex}-correct`} // Groups radio buttons automatically
                            checked={choice.is_correct}
                            onChange={(e) =>
                                updateChoice(
                                    qIndex,
                                    cIndex,
                                    'is_correct',
                                    e.target.checked
                                )
                            }
                            className="w-5 h-5 cursor-pointer accent-[#024C89]"
                        />

                        <TextInput
                            type="text"
                            value={choice.text}
                            onChange={(e) =>
                                updateChoice(
                                    qIndex,
                                    cIndex,
                                    'text',
                                    e.target.value
                                )
                            }
                            placeholder={`Choice ${cIndex + 1}`}
                            className="flex-1 border border-gray-300 rounded! p-2! text-sm! focus:outline-[#024C89] w-full!"
                        />

                        <DefaultButton
                            children="&times;"
                            onClick={() => removeChoice(qIndex, cIndex)}
                            className="text-gray-400 hover:text-[#DC3545] font-bold px-2"
                            title="Remove choice"
                        />
                    </div>
                ))}

                <DefaultButton
                    children="Add Choice"
                    onClick={() => addChoice(qIndex)}
                    className="text-sm text-[#024C89] font-semibold self-start hover:underline mt-1"
                />
            </div>
        </div>
    )
}

export default QuestionCards
