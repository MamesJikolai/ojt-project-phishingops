import DefaultButton from '../DefaultButton.tsx'
import TextInput from '../TextInput.tsx'
import type { User } from '../../types/models.ts'
import { useState } from 'react'

// 2. Add your Campaign type here or import it
interface UserModalProps {
    isOpen: boolean
    onClose: () => void
    mode: 'create' | 'edit'
    initialData?: User | null
    onSave: (user: User) => void
}

function UserModal({
    isOpen,
    onClose,
    mode,
    initialData,
    onSave,
}: UserModalProps) {
    const [name, setName] = useState(initialData?.name || '')
    const [email, setEmail] = useState(initialData?.email || '')
    const [department, setDepartment] = useState(initialData?.department || '')
    const [campaign] = useState(initialData?.campaign || '')
    const [status] = useState(initialData?.status || '')
    const [clicked] = useState(initialData?.clicked || '')
    const [training] = useState(initialData?.training || '')
    const [score] = useState(initialData?.score || 0)

    const [error, setError] = useState('')

    const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError('')

        if (!name || !email || !department) {
            setError('All fields are required!')
            return
        }

        // 2. Package all the current form states into one object
        const userDataToSave = {
            id: initialData?.id || Date.now(), // Generate a fake ID if creating
            name,
            email,
            department,
            campaign,
            status,
            clicked,
            training,
            score,
        }

        // 3. Send it back up to the parent!
        onSave(userDataToSave)
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
                    {mode === 'create' && 'Create User'}
                    {mode === 'edit' && 'Edit User'}
                </h2>

                {error && <p className="text-[#DC3545] text-sm m-0">{error}</p>}

                {/* Make sure your TextInput component accepts the 'disabled' prop! */}
                <TextInput
                    label="Name"
                    type="text"
                    placeholder="User Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full"
                />

                <TextInput
                    label="Email"
                    type="text"
                    placeholder="User Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full"
                />

                <TextInput
                    label="Department"
                    type="text"
                    placeholder="User Department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full"
                />

                <TextInput
                    label="Campaign"
                    type="text"
                    placeholder="Campaign"
                    value={campaign}
                    disabled
                    className="w-full"
                />

                <TextInput
                    label="Status"
                    type="text"
                    placeholder="Status"
                    value={status}
                    disabled
                    className="w-full"
                />

                <TextInput
                    label="Clicked"
                    type="text"
                    placeholder="Clicked"
                    value={clicked}
                    disabled
                    className="w-full"
                />

                <TextInput
                    label="Training"
                    type="text"
                    placeholder="Training"
                    value={training}
                    disabled
                    className="w-full"
                />

                <TextInput
                    label="Score"
                    type="text"
                    placeholder="Score"
                    value={score}
                    disabled
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

export default UserModal
