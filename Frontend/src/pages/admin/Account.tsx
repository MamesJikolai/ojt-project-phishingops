import { useState, useEffect } from 'react'
import Message from '../../components/Message'
import TextInput from '../../components/TextInput'
import DefaultButton from '../../components/DefaultButton'
import type { Accounts } from '../../types/models'
import { apiService } from '../../services/userService'

function Account() {
    const [loading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    const [userData, setUserData] = useState({
        id: 0,
        username: '',
        role: '',
        firstName: '',
        lastName: '',
        email: '',
        organization: '',
        created: '',
    })

    useEffect(() => {
        const fetchCurrentAccount = async () => {
            try {
                setIsLoading(true)

                const fetchedData =
                    await apiService.getAll<Accounts>('accounts')

                const userId = localStorage.getItem('userId')
                const currentUser = fetchedData.find(
                    (u) => u.id === Number(userId)
                )

                if (currentUser) {
                    setUserData({
                        id: currentUser.id,
                        username: currentUser.username || '',
                        role: currentUser.role || '',
                        firstName: currentUser.firstName || '',
                        lastName: currentUser.lastName || '',
                        email: currentUser.email || '',
                        organization: currentUser.organization || '',
                        created: currentUser.created || '',
                    })
                } else {
                    setError('User account not found.')
                }
            } catch (err) {
                console.error('Failed to load account:', err)
                setError('Failed to load account details.')
            } finally {
                setIsLoading(false)
            }
        }

        fetchCurrentAccount()
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

        if (
            !userData.firstName ||
            !userData.lastName ||
            !userData.email ||
            !userData.organization
        ) {
            setError('All fields are required.')
            return
        }

        // Example of how to actually save the data using your service
        try {
            // Uncomment when your update function is ready
            // await apiService.update('accounts', userData.id, userData)
            alert('Account updated successfully!')
        } catch (err) {
            setError('Failed to save changes.')
        }
    }

    const handleRoleColor = () => {
        if (userData.role === 'admin') {
            return 'bg-[#00A3AD]'
        } else if (userData.role === 'hr') {
            return 'bg-[#C5A059]'
        }
        return 'bg-gray-400'
    }

    const handleLogout = () => {
        localStorage.removeItem('userId')
        window.location.href = '/home'
    }

    if (loading) {
        return (
            <div className="m-8 text-gray-500">Loading account details...</div>
        )
    }

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
                                    {userData.username}
                                </span>
                            </p>
                            <p>
                                ROLE
                                <br />
                                <span
                                    className={`${handleRoleColor()} text-[#F8F9FA] px-3 py-1 rounded-xl`}
                                >
                                    {userData.role}
                                </span>
                            </p>
                        </div>
                        <p className="text-[12px] text-right">
                            Created:
                            <br />
                            {userData.created}
                        </p>
                    </div>

                    <div className="flex flex-col gap-6 py-8 border-[#DDE2E5] border-y-[1px]">
                        {error && <p className="text-rose-500">{error}</p>}

                        <TextInput
                            label="First Name"
                            name="firstName"
                            type="text"
                            placeholder="First Name"
                            value={userData.firstName}
                            onChange={handleChange}
                            className="w-full"
                        />
                        <TextInput
                            label="Last Name"
                            name="lastName"
                            type="text"
                            placeholder="Last Name"
                            value={userData.lastName}
                            onChange={handleChange}
                            className="w-full"
                        />
                        <TextInput
                            label="Email"
                            name="email"
                            type="email"
                            placeholder="Email"
                            value={userData.email}
                            onChange={handleChange}
                            className="w-full"
                        />
                        <TextInput
                            label="Organization"
                            name="organization"
                            type="text"
                            placeholder="Organization"
                            value={userData.organization}
                            onChange={handleChange}
                            className="w-full"
                        />

                        <DefaultButton
                            children="Save Changes"
                            type="submit"
                            className="text-[#F8F9FA] bg-[#024C89] hover:bg-[#3572A1]"
                        />
                    </div>

                    <DefaultButton
                        children="Change Password"
                        type="button"
                        // onClick={handleLogout}
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
