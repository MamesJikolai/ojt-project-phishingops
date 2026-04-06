import DefaultButton from '../DefaultButton.tsx'
import TextInput from '../TextInput.tsx'
import type { Course } from '../../types/models.ts'
import { useState } from 'react'
import TextField from '../TextField.tsx'

interface CourseModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (course: Course) => void
}

function CourseModal({ isOpen, onClose, onSave }: CourseModalProps) {
    const [title, setTitle] = useState('')
    const [caption, setCaption] = useState('')
    const [description, setDescription] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError('')

        if (!title || !description) {
            setError('All fields are required!')
            return
        }

        const courseDataToSave: Partial<Course> = {
            title,
            description,
            caption,
        }

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
                    type="button"
                    onClick={onClose}
                    className="absolute top-1 right-4 text-[#4A4A4A] hover:text-[#DC3545] text-3xl font-bold z-10 transition-colors"
                    aria-label="Close modal"
                >
                    &times;
                </button>

                <h2>Create Course</h2>

                {error && (
                    <div className="bg-rose-100 border border-rose-400 text-rose-700 px-2 py-1 my-2 rounded relative">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

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

                <TextField
                    label="Description"
                    placeholder="Course Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full"
                    rows={5}
                />

                <DefaultButton
                    type="submit"
                    className="bg-[#024C89] hover:bg-[#3572A1] text-[#F8F9FA] self-center mt-4"
                >
                    Create Course
                </DefaultButton>
            </form>
        </div>
    )
}

export default CourseModal
