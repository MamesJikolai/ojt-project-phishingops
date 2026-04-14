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
                    name="full_name"
                    placeholder="User Name"
                    value={targetData.full_name}
                    onChange={handletargetDataChange}
                    className="w-full"
                />

                <TextInput
                    label="Email"
                    type="email"
                    name="email"
                    placeholder="Full Email"
                    value={targetData.email || ''}
                    onChange={handletargetDataChange}
                    className="w-full"
                />

                <TextInput
                    label="Department"
                    type="text"
                    name="department"
                    placeholder="User Department"
                    value={targetData.department || ''}
                    onChange={handletargetDataChange}
                    className="w-full"
                />

                <TextInput
                    label="Position"
                    type="text"
                    name="position"
                    placeholder="User Position"
                    value={targetData.position || ''}
                    onChange={handletargetDataChange}
                    className="w-full"
                />

                <label>
                    <span className="font-medium text-[#121212]">
                        Business Unit
                    </span>
                    <br />
                    <select
                        name="business_unit"
                        value={targetData.business_unit || 'Ortigas'}
                        onChange={handletargetDataChange}
                        className="text-[#4A4A4A] bg-[#F8F9FA] border-2 border-[#DDE2E5] focus:outline-[#024C89] active:outline-[#024C89] w-full max-w-2xl rounded-4xl px-2 py-1 disabled:bg-gray-200 disabled:opacity-70"
                    >
                        <option value="" disabled hidden>
                            -- Select an option --
                        </option>
                        <option value="Ortigas">Ortigas</option>
                        <option value="Clark">Clark</option>
                        <option value="Pangasinan">Pangasinan</option>
                        <option value="South Luzon">South Luzon</option>
                        <option value="Iloilo">Iloilo</option>
                        <option value="Proser">Proser</option>
                    </select>
                </label>

                <TextInput
                    label="Manager"
                    type="text"
                    name="manager"
                    placeholder="Manager Full Name"
                    value={targetData.manager || ''}
                    onChange={handletargetDataChange}
                    className="w-full"
                />

                <TextInput
                    label="Manager Email"
                    type="text"
                    name="manager_email"
                    placeholder="e.g. manager@email.com"
                    value={targetData.manager_email || ''}
                    onChange={handletargetDataChange}
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
