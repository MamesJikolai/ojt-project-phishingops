import DefaultButton from '../DefaultButton.tsx'
import TextInput from '../TextInput.tsx'
import type { EmailTemplate } from '../../types/models.ts'
import { useState } from 'react'
import TextField from '../TextField.tsx'

interface TemplateModalProps {
    isOpen: boolean
    onClose: () => void
    mode: 'create' | 'view' | 'edit'
    initialData?: EmailTemplate | null
    onSave: (template: EmailTemplate) => void
}

function TemplateModal({
    isOpen,
    onClose,
    mode,
    initialData,
    onSave,
}: TemplateModalProps) {
    const [name, setName] = useState(initialData?.name || '')
    const [author, setAuthor] = useState(initialData?.author || '')
    const [subject, setSubject] = useState(initialData?.subject || '')
    const [body, setBody] = useState(initialData?.body || '')
    const [link, setLink] = useState(initialData?.link || '')
    const [error, setError] = useState('')

    const isViewOnly = mode === 'view'

    const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError('')

        if (!name || !author || !subject || !body) {
            setError('All fields are required!')
            return
        }

        const templateDataToSave = {
            id: initialData?.id || Date.now(), // Generate a fake ID if creating
            name,
            author,
            subject,
            body,
            link,
            created: initialData?.created || new Date().toLocaleString(),
        }

        onSave(templateDataToSave)
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
                    {mode === 'create' && 'Create Template'}
                    {mode === 'edit' && 'Edit Template'}
                    {mode === 'view' && 'Template Details'}
                </h2>

                {error && <p className="text-[#DC3545] text-sm m-0">{error}</p>}

                <TextInput
                    label="Name"
                    type="text"
                    placeholder="Template Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full"
                    disabled={isViewOnly}
                />

                <TextInput
                    label="Author"
                    type="text"
                    placeholder="Template Author"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full"
                    disabled={isViewOnly}
                />

                <TextInput
                    label="Subject"
                    type="text"
                    placeholder="Email Subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full"
                    disabled={isViewOnly}
                />

                <TextField
                    label="Body"
                    placeholder="Email Body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full"
                    disabled={isViewOnly}
                    rows={10}
                />

                <TextInput
                    label="Link"
                    type="text"
                    placeholder="Email Link"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="w-full"
                    disabled={isViewOnly}
                />

                {/* Hide the submit button completely if we are just viewing */}
                {!isViewOnly && (
                    <DefaultButton
                        type="submit"
                        className="bg-[#024C89] hover:bg-[#3572A1] text-[#F8F9FA] self-center mt-4"
                    >
                        {mode === 'create' ? 'Create' : 'Save Changes'}
                    </DefaultButton>
                )}
            </form>
        </div>
    )
}

export default TemplateModal
