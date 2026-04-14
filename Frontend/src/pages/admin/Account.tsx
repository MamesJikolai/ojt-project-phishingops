import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Message from '../../components/Message'
import TextInput from '../../components/TextInput'
import DefaultButton from '../../components/DefaultButton'
import { apiService } from '../../services/userService'
import { useAuth } from '../../context/AuthContext'
import ChangePasswordModal from '../../components/Account/ChangePasswordModal'

function Account() {
    const { user, login, logout } = useAuth() // Grab user data and functions from context
    const [userData, setUserData] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        email: user?.email || '',
    })
    const [error, setError] = useState('')
    const [successMessage, setSuccessMessage] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const navigate = useNavigate()

    // Pre-fill state with context data using Django's snake_case variable names
    useEffect(() => {
        if (user) {
            setUserData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
            })
        }
    }, [user])

    const openPasswordModal = useCallback(() => {
        setIsModalOpen(true)
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setUserData((prevData) => ({
            ...prevData,
            [name]: value,
        }))
    }

    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError('')
        setSuccessMessage('')

        if (!userData.first_name || !userData.last_name || !userData.email) {
            setError('First name, last name, and email are required.')
            return
        }

        try {
            setIsSubmitting(true)

            // Send the PATCH request to Django
            const updatedUser = await apiService.updateMe(userData)

            // Update the global context so the whole app knows the new name!
            login(updatedUser)

            setSuccessMessage('Account updated successfully!')
        } catch (err) {
            console.error('Failed to save changes:', err)
            setError('Failed to save changes. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleRoleColor = () => {
        if (user?.role === 'admin') return 'bg-[#00A3AD]'
        if (user?.role === 'hr') return 'bg-[#C5A059]'
        if (user?.is_staff) return 'bg-[#00A3AD]' // Fallback for Django standard staff
        return 'bg-gray-400'
    }

    const handleLogout = () => {
        // Use context logout and React Router navigate
        logout()
        navigate('/login')
    }

    if (!user) return null

    return (
        <div className="flex flex-col items-start p-4 md:p-8 w-full">
            <Message text="Account" />

            <div className="flex flex-col gap-4 bg-[#FEF9FA] w-full max-w-150 mx-auto px-6 py-4 md:px-12 md:py-8 rounded-xl drop-shadow-md">
                <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                    <div className="flex flex-row justify-between items-start">
                        <div className="flex flex-row gap-8">
                            <p>
                                USERNAME
                                <br />
                                <span className="font-bold">
                                    {user.username}
                                </span>
                            </p>
                            <p>
                                ROLE
                                <br />
                                <span
                                    className={`${handleRoleColor()} text-[#F8F9FA] px-3 py-1 rounded-xl uppercase`}
                                >
                                    {user.role}
                                </span>
                            </p>
                        </div>

                        <p className="text-[12px] text-right">
                            Created:
                            <br />
                            {new Date(user.date_joined).toLocaleDateString()}
                        </p>
                    </div>

                    <div className="flex flex-col gap-6 py-8 border-[#DDE2E5] border-y-[1px]">
                        {error && <p className="text-rose-500">{error}</p>}
                        {successMessage && (
                            <p className="text-emerald-600 font-medium">
                                {successMessage}
                            </p>
                        )}

                        <TextInput
                            label="First Name"
                            name="first_name"
                            type="text"
                            placeholder="First Name"
                            value={userData.first_name}
                            onChange={handleChange}
                            className="w-full"
                            disabled={isSubmitting}
                        />
                        <TextInput
                            label="Last Name"
                            name="last_name"
                            type="text"
                            placeholder="Last Name"
                            value={userData.last_name}
                            onChange={handleChange}
                            className="w-full"
                            disabled={isSubmitting}
                        />
                        <TextInput
                            label="Email"
                            name="email"
                            type="email"
                            placeholder="Email"
                            value={userData.email}
                            onChange={handleChange}
                            className="w-full"
                            disabled={isSubmitting}
                        />

                        <DefaultButton
                            children={
                                isSubmitting ? 'Saving...' : 'Save Changes'
                            }
                            type="submit"
                            disabled={isSubmitting}
                            className="text-[#F8F9FA] bg-[#024C89] hover:bg-[#3572A1] disabled:opacity-50"
                        />
                    </div>

                    <DefaultButton
                        children="Change Password"
                        onClick={openPasswordModal}
                        type="button"
                        className="text-[#024C89] border-2 border-[#024C89] hover:bg-[#024C89] hover:text-[#F8F9FA]"
                    />

                    <DefaultButton
                        children="Sign Out"
                        type="button"
                        onClick={handleLogout}
                        className="bg-[#DC3545] hover:bg-[#FF6B6B] text-[#F8F9FA]"
                    />
                </form>
            </div>

            {isModalOpen && (
                <ChangePasswordModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    )
}

export default Account
