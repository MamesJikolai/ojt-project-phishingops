import DefaultButton from '../DefaultButton.tsx'
import TextInput from '../TextInput.tsx'
import type { EmailTemplate } from '../../types/models.ts'
import { useState } from 'react'
import TextField from '../TextField.tsx'
import { useAuth } from '../../context/AuthContext.tsx'

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
    const { user } = useAuth()
    const [emailTemplateData, setEmailTemplateData] = useState({
        id: initialData?.id || 0,
        name: initialData?.name || '',
        author: user?.username,
        sender_name: initialData?.sender_name || '',
        company_name: initialData?.company_name || '',
        subject: initialData?.subject || '',
        body_html: initialData?.body_html || '',
        email_signature: initialData?.email_signature || '',
        created_at: initialData?.created_at || new Date().toLocaleString(),
    })
    const [error, setError] = useState('')

    const isViewOnly = mode === 'view'

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target

        setEmailTemplateData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError('')

        if (
            !emailTemplateData.name ||
            !emailTemplateData.author ||
            !emailTemplateData.sender_name ||
            !emailTemplateData.subject ||
            !emailTemplateData.body_html
        ) {
            setError('All fields are required!')
            return
        }

        onSave(emailTemplateData)
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

                {error && (
                    <div className="bg-rose-100 border border-rose-400 text-rose-700 px-2 py-1 my-2 rounded relative">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                <TextInput
                    label="Name"
                    type="text"
                    placeholder="Template Name"
                    value={emailTemplateData.name}
                    onChange={handleInputChange}
                    className="w-full"
                    disabled={isViewOnly}
                />

                <TextInput
                    label="Author"
                    type="text"
                    placeholder="Template Author"
                    value={emailTemplateData.author}
                    onChange={handleInputChange}
                    className="w-full"
                    disabled
                />

                <TextInput
                    label="Sender"
                    type="text"
                    placeholder="Sender Name"
                    value={emailTemplateData.sender_name}
                    onChange={handleInputChange}
                    className="w-full"
                    disabled={isViewOnly}
                />

                <TextInput
                    label="Company Name"
                    type="text"
                    placeholder="Dummy Company Name"
                    value={emailTemplateData.company_name}
                    onChange={handleInputChange}
                    className="w-full"
                    disabled={isViewOnly}
                />

                <TextInput
                    label="Subject"
                    type="text"
                    placeholder="Email Subject"
                    value={emailTemplateData.subject}
                    onChange={handleInputChange}
                    className="w-full"
                    disabled={isViewOnly}
                />

                <TextField
                    label="Body"
                    description={!isViewOnly && bodyDescription}
                    placeholder="Email Body"
                    value={emailTemplateData.body_html}
                    onChange={handleInputChange}
                    className="w-full"
                    disabled={isViewOnly}
                    rows={isViewOnly ? 12 : 10}
                />

                {isViewOnly ? (
                    ''
                ) : (
                    <TextInput
                        label="Email Signature"
                        type="file"
                        accept="image/png, image/jpeg, .png, .jpg, .jpeg,"
                    />
                )}

                {/* Hide the submit button completely if we are just viewing */}
                {!isViewOnly && (
                    <DefaultButton
                        type="submit"
                        className="w-full bg-[#024C89] hover:bg-[#3572A1] text-[#F8F9FA] self-center mt-4"
                    >
                        {mode === 'create' ? 'Create' : 'Save Changes'}
                    </DefaultButton>
                )}
            </form>
        </div>
    )
}

export default TemplateModal

const availableVariables = [
    '{{ target_name }}',
    '{{ target_email }}',
    '{{ target_department }}',
    '{{ phishing_link }}',
    '{{ company_name }}',
    '{{ campaign_name }}',
]

const bodyDescription = (
    <div className="flex flex-col gap-4 mt-2">
        <div>
            <span className="font-medium text-[#121212] block mb-2">
                Available variables:
            </span>
            <div className="flex flex-wrap gap-2">
                {availableVariables.map((variable) => (
                    <code
                        key={variable}
                        className="bg-gray-100 border border-gray-200 text-gray-800 px-2 py-1 rounded-md font-mono text-xs"
                    >
                        {variable}
                    </code>
                ))}
            </div>
        </div>

        <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-xl">
            <span className="font-medium text-[#121212] block mb-1">
                Clickable link with custom text:
            </span>
            <p className="mb-1 text-[#4a4a4a]">
                Use{' '}
                <code className="bg-[#F8F9FA] px-1 py-0.5 rounded border border-gray-200 font-mono text-xs">
                    [display text](url)
                </code>{' '}
                syntax.
            </p>
            <p className="text-[#4a4a4a] text-xs mt-2 italic">
                e.g. Click{' '}
                <code className="bg-[#F8F9FA] px-1 py-0.5 rounded border border-gray-200 font-mono text-xs not-italic">
                    [here]({'{{ phishing_link }}'})
                </code>{' '}
                to verify your account
            </p>
        </div>
    </div>
)
