import DefaultButton from '../DefaultButton.tsx'
import TextInput from '../TextInput.tsx'
import type { Course } from '../../types/models.ts'
import { useState } from 'react'

// 2. Add your Course type here or import it
interface CourseModalProps {
    isOpen: boolean
    onClose: () => void
    mode: 'create' | 'edit'
    initialData?: Course | null
    onSave: (course: Course) => void
}

function CourseModal({
    isOpen,
    onClose,
    mode,
    initialData,
    onSave,
}: CourseModalProps) {
    // id: number
    // title: string
    // description: string
    // thumbnail: string
    // is_published: boolean
    // total_lessons: number
    // has_quiz: true
    // lessons: Lesson[]
    // quiz: string
    // created_at: string
    // uodated_at: string

    const [title, setTitle] = useState(initialData?.title || '')
    const [caption, setCaption] = useState(initialData?.caption || '')
    const [description, setDescription] = useState(
        initialData?.description?.toLowerCase() || ''
    )
    const [error, setError] = useState('')

    const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError('')

        if (!title || !description) {
            setError('All fields are required!')
            return
        }

        // 2. Package all the current form states into one object
        const courseDataToSave: Partial<Course> = {
            title,
            description,
            caption,
        }

        // 3. Send it back up to the parent!
        onSave(courseDataToSave as Course)
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-[8px] bg-[#F8F9FA] relative w-full max-w-2xl max-h-[90vh] px-[32px] py-[48px] overflow-y-auto rounded-xl drop-shadow-md"
            >
                <button
                    type="button" // Important so this doesn't submit the form
                    onClick={onClose}
                    className="absolute top-1 right-4 text-[#4A4A4A] hover:text-[#DC3545] text-3xl font-bold z-10 transition-colors"
                    aria-label="Close modal"
                >
                    &times;
                </button>

                <h2>
                    {mode === 'create' && 'Create Course'}
                    {mode === 'edit' && 'Edit Course'}
                </h2>

                {error && <p className="text-[#DC3545] text-sm m-0">{error}</p>}

                <TextInput
                    label="Title"
                    type="text"
                    placeholder="Course Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full"
                />

                <TextInput
                    label="Caption"
                    type="text"
                    placeholder="Course Caption"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="w-full"
                />

                <TextInput
                    label="Description"
                    type="text"
                    placeholder="Course Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full"
                />

                <DefaultButton
                    type="submit"
                    className="bg-[#024C89] hover:bg-[#3572A1] text-[#F8F9FA] self-center mt-4"
                >
                    {mode === 'create' ? 'Create' : 'Save Changes'}
                </DefaultButton>
            </form>
        </div>
    )
}

export default CourseModal
