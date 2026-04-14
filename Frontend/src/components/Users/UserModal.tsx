import DefaultButton from '../DefaultButton.tsx'
import TextInput from '../TextInput.tsx'
import type { User } from '../../types/models.ts'
import { useState } from 'react'

interface UserModalProps {
    isOpen: boolean
    onClose: () => void
    initialData?: User | null
    onSave: (user: Partial<User>) => void
}

function UserModal({ isOpen, onClose, initialData, onSave }: UserModalProps) {
    const [targetData, setTargetData] = useState<Partial<User>>(
        initialData || {
            full_name: '',
            email: '',
            department: '',
            position: '',
            business_unit: 'Ortigas',
            manager: '',
            manager_email: '',
        }
    )

    const [error, setError] = useState('')

    const handletargetDataChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target
        setTargetData((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError('')

        if (
            !targetData.full_name ||
            !targetData.email ||
            !targetData.department
        ) {
            setError('Name, Email, and Department are required!')
            return
        }

        const userDataToSave: Partial<User> = {
            ...targetData,
            ...(initialData && { id: initialData.id }),
            campaign: initialData?.campaign,
        }

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
                    type="button"
                    onClick={onClose}
                    className="absolute top-1 right-4 text-[#4A4A4A] hover:text-[#DC3545] text-3xl font-bold z-10 transition-colors"
                    aria-label="Close modal"
                >
                    &times;
                </button>

                <h2 className="mb-2">Edit User</h2>

                {error && <p className="text-[#DC3545] text-sm m-0">{error}</p>}

                <TextInput
                    label="Name"
                    type="text"
                    placeholder="User Name"
                    value={full_name}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full"
                />

                <TextInput
                    label="Email"
                    type="email"
                    placeholder="Full Email"
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
                    label="Position"
                    type="text"
                    placeholder="User Position"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full"
                />

                <DefaultButton
                    type="submit"
                    className="bg-[#024C89] hover:bg-[#3572A1] text-[#F8F9FA] self-center mt-4 px-8"
                >
                    Save Changes
                </DefaultButton>
            </form>
        </div>
    )
}

export default UserModal
