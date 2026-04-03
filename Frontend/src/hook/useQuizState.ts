import { useState, useEffect } from 'react'
import type { Quiz, QuizQuestions, QuizChoices } from '../types/models'

const generateBlankChoice = (order: number): QuizChoices => ({
    id: 0,
    text: '',
    is_correct: false,
    order: order,
})

const generateBlankQuestion = (order: number): QuizQuestions => ({
    id: 0,
    text: '',
    question_type: 'single',
    order: order,
    explanation: '',
    choices: [generateBlankChoice(0), generateBlankChoice(1)],
})

export function useQuizState(
    mode: 'create' | 'edit',
    initialData?: Quiz | null
) {
    const [quizState, setQuizState] = useState<Quiz>({
        id: 0,
        title: '',
        passing_score: 80,
        max_attempts: 3,
        instructions: '',
        total_questions: 0,
        questions: [],
    })
    const [deletedQuestions, setDeletedQuestions] = useState<number[]>([])
    const [deletedChoices, setDeletedChoices] = useState<
        { qId: number; cId: number }[]
    >([])

    useEffect(() => {
        if (mode === 'edit' && initialData) {
            setQuizState(initialData)
        } else if (mode === 'create') {
            setQuizState((prev) => ({
                ...prev,
                questions: [generateBlankQuestion(0)],
            }))
        }
    }, [mode, initialData])

    const handleQuizChange = (field: keyof Quiz, value: any) => {
        setQuizState((prev) => ({ ...prev, [field]: value }))
    }

    const addQuestion = () => {
        setQuizState((prev) => ({
            ...prev,
            questions: [
                ...prev.questions,
                generateBlankQuestion(prev.questions.length),
            ],
        }))
    }

    const updateQuestion = (
        qIndex: number,
        field: keyof QuizQuestions,
        value: any
    ) => {
        setQuizState((prev) => {
            const updatedQuestions = [...prev.questions]
            updatedQuestions[qIndex] = {
                ...updatedQuestions[qIndex],
                [field]: value,
            }

            // If switching from multiple to single choice, reset correct answers to prevent invalid states
            if (field === 'question_type' && value === 'single') {
                updatedQuestions[qIndex].choices = updatedQuestions[
                    qIndex
                ].choices.map((c) => ({ ...c, is_correct: false }))
            }

            return { ...prev, questions: updatedQuestions }
        })
    }

    const removeQuestion = (qIndex: number) => {
        setQuizState((prev) => {
            const questionToRemove = prev.questions[qIndex]

            // If it has an ID, it exists in the DB, so we must track it for deletion
            if (questionToRemove.id > 0) {
                setDeletedQuestions((curr) => [...curr, questionToRemove.id])
            }

            return {
                ...prev,
                questions: prev.questions.filter((_, i) => i !== qIndex),
            }
        })
    }

    const addChoice = (qIndex: number) => {
        setQuizState((prev) => {
            const updatedQuestions = [...prev.questions]

            // 1. Create a new copy of the specific question
            const targetQuestion = { ...updatedQuestions[qIndex] }

            // 2. Create a new copy of its choices array
            const updatedChoices = [...targetQuestion.choices]

            // 3. Add the new choice
            const order = updatedChoices.length
            updatedChoices.push(generateBlankChoice(order))

            // 4. Reassign the updated arrays back into the state
            targetQuestion.choices = updatedChoices
            updatedQuestions[qIndex] = targetQuestion

            return { ...prev, questions: updatedQuestions }
        })
    }

    const updateChoice = (
        qIndex: number,
        cIndex: number,
        field: keyof QuizChoices,
        value: any
    ) => {
        setQuizState((prev) => {
            const updatedQuestions = [...prev.questions]
            const choices = [...updatedQuestions[qIndex].choices]

            // Enforce single choice logic: if setting one to true, make others false
            if (
                field === 'is_correct' &&
                value === true &&
                updatedQuestions[qIndex].question_type === 'single'
            ) {
                choices.forEach((choice, idx) => {
                    choices[idx] = { ...choice, is_correct: false }
                })
            }

            choices[cIndex] = { ...choices[cIndex], [field]: value }
            updatedQuestions[qIndex].choices = choices

            return { ...prev, questions: updatedQuestions }
        })
    }

    const removeChoice = (qIndex: number, cIndex: number) => {
        setQuizState((prev) => {
            const updatedQuestions = [...prev.questions]
            const q = updatedQuestions[qIndex]
            const cToRemove = q.choices[cIndex]

            // If the choice AND the question exist in the DB, track for deletion
            if (cToRemove.id > 0 && q.id > 0) {
                setDeletedChoices((curr) => [
                    ...curr,
                    { qId: q.id, cId: cToRemove.id },
                ])
            }

            updatedQuestions[qIndex].choices = updatedQuestions[
                qIndex
            ].choices.filter((_, i) => i !== cIndex)
            return { ...prev, questions: updatedQuestions }
        })
    }

    return {
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
    }
}
