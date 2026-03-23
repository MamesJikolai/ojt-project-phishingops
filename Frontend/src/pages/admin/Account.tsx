import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Message from '../../components/Message'
import TextInput from '../../components/TextInput'
import DefaultButton from '../../components/DefaultButton'
import { apiService } from '../../services/userService'
import { useAuth } from '../../context/AuthContext'

function Account() {
    const { user, login, logout } = useAuth() // 1. Grab user data and functions from context
    const navigate = useNavigate()

    const [error, setError] = useState('')
    const [successMessage, setSuccessMessage] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // 2. Pre-fill state with context data using Django's snake_case variable names
    const [userData, setUserData] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        email: user?.email || '',
        // organization: '', // Note: Django's default User model lacks this field!
    })

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

            // 3. Send the PATCH request to Django
            const updatedUser = await apiService.updateMe(userData)

            // 4. Update the global context so the whole app knows the new name!
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
        // 5. Use context logout and React Router navigate
        logout()
        navigate('/home')
    }

    // Since AuthContext acts as the gatekeeper, 'user' is guaranteed to exist here
    // But we can add a fallback just in case.
    if (!user) return null

    return (
        <div className="flex flex-col items-start m-8">
            <Message text="Account" />

            <div className="flex flex-col gap-4 bg-[#FEF9FA] w-[90%] max-w-[600px] mx-auto px-[48px] py-[32px] rounded-xl drop-shadow-md">
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
                                    {user.role ||
                                        (user.is_staff ? 'Admin' : 'User')}
                                </span>
                            </p>
                        </div>
                        {/* Assuming date_joined is added to your AuthUser interface */}
                        {/* <p className="text-[12px] text-right">
                            Created:
                            <br />
                            {new Date(user.date_joined).toLocaleDateString()}
                        </p> */}
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
                            name="first_name" // Updated to match Django
                            type="text"
                            placeholder="First Name"
                            value={userData.first_name}
                            onChange={handleChange}
                            className="w-full"
                            disabled={isSubmitting}
                        />
                        <TextInput
                            label="Last Name"
                            name="last_name" // Updated to match Django
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
        </div>
    )
}

export default Account
