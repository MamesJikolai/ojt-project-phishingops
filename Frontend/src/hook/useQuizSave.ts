// hooks/useQuizSave.ts
import { useState } from 'react'
import { apiService } from '../services/userService'
import type { Quiz, QuizQuestions } from '../types/models'

export function useQuizSave(courseId?: string) {
    const [isSaving, setIsSaving] = useState(false)

    const saveQuiz = async (
        mode: 'create' | 'edit',
        quizState: Quiz,
        deletedQuestions: number[],
        deletedChoices: any[],
        onSuccess: () => void
    ) => {
        if (!courseId) return

        // --- 1. FRONTEND VALIDATION ---
        if (!quizState.title.trim()) {
            return alert('Validation Error: Quiz Title is required.')
        }

        for (let i = 0; i < quizState.questions.length; i++) {
            const q = quizState.questions[i]

            if (!q.text.trim()) {
                return alert(
                    `Validation Error: Question ${i + 1} is missing text.`
                )
            }
            if (q.choices.length < 2) {
                return alert(
                    `Validation Error: Question ${i + 1} must have at least 2 choices.`
                )
            }

            let hasCorrect = false
            for (let j = 0; j < q.choices.length; j++) {
                const c = q.choices[j]
                if (!c.text.trim()) {
                    return alert(
                        `Validation Error: Choice ${j + 1} in Question ${i + 1} is missing text.`
                    )
                }
                if (c.is_correct) hasCorrect = true
            }

            if (!hasCorrect) {
                return alert(
                    `Validation Error: Question ${i + 1} must have at least one correct choice selected.`
                )
            }
        }
        // ------------------------------

        setIsSaving(true)
        try {
            let currentQuizId = quizState.id

            // Step 1: Process Deletions First
            for (const choice of deletedChoices) {
                await apiService.delete(
                    `questions/${choice.qId}/choices`,
                    choice.cId
                )
            }
            for (const qId of deletedQuestions) {
                await apiService.delete(
                    `quizzes/${currentQuizId}/questions`,
                    qId
                )
            }

            // Step 2: Create or Update the Quiz itself
            const quizPayload = {
                title: quizState.title,
                passing_score: quizState.passing_score,
                max_attempts: quizState.max_attempts,
                instructions: quizState.instructions,
            }

            if (mode === 'create') {
                const newQuiz = await apiService.create<Quiz>(
                    `courses/${courseId}/quiz`,
                    quizPayload
                )
                currentQuizId = newQuiz.id
            } else {
                await apiService.update(
                    `courses/${courseId}/quiz`,
                    currentQuizId,
                    quizPayload,
                    'PATCH'
                )
            }

            // Step 3: Loop through and save Questions
            for (
                let qIndex = 0;
                qIndex < quizState.questions.length;
                qIndex++
            ) {
                const question = quizState.questions[qIndex]
                let currentQuestionId = question.id

                const qPayload = {
                    text: question.text,
                    question_type: question.question_type,
                    order: qIndex,
                    // Only send explanation if it exists to avoid DRF rejecting empty strings
                    ...(question.explanation.trim()
                        ? { explanation: question.explanation }
                        : {}),
                }

                if (currentQuestionId === 0) {
                    const newQ = await apiService.create<QuizQuestions>(
                        `quizzes/${currentQuizId}/questions`,
                        qPayload
                    )
                    currentQuestionId = newQ.id
                } else {
                    await apiService.update(
                        `quizzes/${currentQuizId}/questions`,
                        currentQuestionId,
                        qPayload,
                        'PATCH'
                    )
                }

                // Step 4: Loop through and save Choices for THIS question
                for (
                    let cIndex = 0;
                    cIndex < question.choices.length;
                    cIndex++
                ) {
                    const choice = question.choices[cIndex]

                    const cPayload = {
                        text: choice.text,
                        is_correct: choice.is_correct,
                        order: cIndex,
                    }

                    if (choice.id === 0) {
                        await apiService.create(
                            `questions/${currentQuestionId}/choices`,
                            cPayload
                        )
                    } else {
                        await apiService.update(
                            `questions/${currentQuestionId}/choices`,
                            choice.id,
                            cPayload,
                            'PATCH'
                        )
                    }
                }
            }

            // Step 5: Success! Close and refresh.
            onSuccess()
        } catch (error: any) {
            console.error('Failed to complete save sequence:', error)

            // --- 2. EXTRACT EXACT DRF ERRORS ---
            const backendError = error.response?.data
                ? JSON.stringify(error.response.data, null, 2)
                : error.message

            alert(`Backend Validation Error:\n${backendError}`)
            console.error('Detailed error info:', backendError || error)
        } finally {
            setIsSaving(false)
        }
    }

    return { isSaving, saveQuiz }
}
