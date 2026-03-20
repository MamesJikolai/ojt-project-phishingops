import DefaultButton from '../DefaultButton.tsx'
import TextInput from '../TextInput.tsx'
import type { Account } from '../../types/models.ts'
import { useState } from 'react'

// 2. Add your Campaign type here or import it
interface AdminUsersModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (account: Account) => void
}

function AdminUserModal({ isOpen, onClose, onSave }: AdminUsersModalProps) {
    const [username, setUsername] = useState('')
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [role, setRole] = useState('')
    const [email, setEmail] = useState('')
    const [organization, setOrganization] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError('')

        if (
            !username ||
            !firstName ||
            !lastName ||
            !role ||
            !email ||
            !organization
        ) {
            setError('All fields are required!')
            return
        }

        // 2. Package all the current form states into one object
        const accountDataToSave = {
            id: Date.now(), // Generate a fake ID if creating
            username,
            password: '',
            firstName,
            lastName,
            role,
            email,
            organization,
            created: new Date().toString(),
        }

        // 3. Send it back up to the parent!
        onSave(accountDataToSave)
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

                <h2>Create Account</h2>

                {error && <p className="text-[#DC3545] text-sm m-0">{error}</p>}

                {/* Make sure your TextInput component accepts the 'disabled' prop! */}
                <TextInput
                    label="Username"
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full"
                />

                <TextInput
                    label="First Name"
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full"
                />

                <TextInput
                    label="Last Name"
                    type="text"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full"
                />

                <TextInput
                    label="Role"
                    type="text"
                    placeholder="Role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full"
                />

                <TextInput
                    label="Email"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full"
                />

                <TextInput
                    label="Organization"
                    type="text"
                    placeholder="Organization"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="w-full"
                />

                <DefaultButton
                    type="submit"
                    className="bg-[#024C89] hover:bg-[#3572A1] text-[#F8F9FA] self-center mt-4"
                >
                    Create
                </DefaultButton>
            </form>
        </div>
    )
}

export default AdminUserModal
