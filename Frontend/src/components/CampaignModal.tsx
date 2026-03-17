import DefaultButton from '../components/DefaultButton.tsx'
import TextInput from './TextInput.tsx'
import TextField from './TextField.tsx'
import type { Campaign } from '../pages/admin/Campaigns.tsx'
import { useState } from 'react' // 1. Removed useEffect

// 2. Add your Campaign type here or import it
interface CampaignModalProps {
    isOpen: boolean
    onClose: () => void
    mode: 'create' | 'view' | 'edit'
    initialData?: Campaign | null
    onSave: (campaign: Campaign) => void
}

function CampaignModal({
    isOpen,
    onClose,
    mode,
    initialData,
    onSave,
}: CampaignModalProps) {
    // 3. Initialize state directly with the props!
    // If initialData is null (like in 'create' mode), it falls back to an empty string.
    const [name, setName] = useState(initialData?.name || '')
    const [status, setStatus] = useState(
        initialData?.status?.toLowerCase() || ''
    )
    const [date, setDate] = useState(initialData?.date || '')
    const [target, setTarget] = useState(initialData?.target || '')
    const [subject, setSubject] = useState(initialData?.subject || '')
    const [body, setBody] = useState(initialData?.body || '')
    const [error, setError] = useState('')

    const isViewOnly = mode === 'view'

    // 4. We completely deleted the useEffect block!

    const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError('')

        if (!name || !status || !date || !target || !subject || !body) {
            setError('All fields are required!')
            return
        }

        // 2. Package all the current form states into one object
        const campaignDataToSave = {
            id: initialData?.id || Date.now(), // Generate a fake ID if creating
            name,
            status,
            date,
            target,
            completion: initialData?.completion || '0%', // Keep existing completion or default to 0
            subject,
            body,
        }

        // 3. Send it back up to the parent!
        onSave(campaignDataToSave)
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
                    {mode === 'create' && 'Create Campaign'}
                    {mode === 'edit' && 'Edit Campaign'}
                    {mode === 'view' && 'Campaign Details'}
                </h2>

                {error && <p className="text-[#DC3545] text-sm m-0">{error}</p>}

                {/* Make sure your TextInput component accepts the 'disabled' prop! */}
                <TextInput
                    label="Name"
                    type="text"
                    placeholder="Campaign Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full"
                    disabled={isViewOnly}
                />

                <label>
                    <span className="font-bold text-[#121212]">Status</span>
                    <br />
                    <select
                        name="status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        disabled={isViewOnly}
                        className="text-[#4A4A4A] bg-#F8F9FA border-2 border-[#DDE2E5] focus:outline-[#024C89] active:outline-[#024C89] w-full max-w-2xl rounded-[16px] px-4 py-2 disabled:bg-gray-200 disabled:opacity-70"
                    >
                        <option value="" disabled hidden>
                            -- Select an option --
                        </option>
                        <option value="Draft">Draft</option>
                        <option value="Archived">Archived</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="Completed">Completed</option>
                    </select>
                </label>

                <TextInput
                    label="Date"
                    type="date"
                    placeholder="Campaign Date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full"
                    disabled={isViewOnly}
                />

                <TextInput
                    label="Target"
                    type="text"
                    placeholder="Campaign Target"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
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

                {/* Make sure TextField accepts 'disabled' */}
                <TextField
                    label="Body"
                    placeholder="Email Body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full"
                    rows={6}
                    disabled={isViewOnly}
                />

                {/* Hide the submit button completely if we are just viewing */}
                {!isViewOnly && (
                    <DefaultButton type="submit" className="self-center mt-4">
                        {mode === 'create' ? 'Create' : 'Save Changes'}
                    </DefaultButton>
                )}
            </form>
        </div>
    )
}

export default CampaignModal
