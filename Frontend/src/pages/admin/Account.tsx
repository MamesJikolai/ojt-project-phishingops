import { useState } from 'react'
import Message from '../../components/Message'
import TextInput from '../../components/TextInput'
import DefaultButton from '../../components/DefaultButton'
import { users } from '../../assets/users'

function Account() {
    const userId = localStorage.getItem('userId')
    const user = users.find((u) => u.id === Number(userId))
    const [error, setError] = useState('')

    const [userData, setUserData] = useState({
        username: user?.username || '',
        role: user?.role || '',
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        organization: user?.organization || '',
        created: user?.created || '',
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setUserData((prevData) => ({
            ...prevData,
            [name]: value,
        }))
    }

    const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError('')

        if (
            !userData.firstName ||
            !userData.lastName ||
            !userData.email ||
            !userData.organization
        ) {
            setError('All fields required.')
        }
    }

    const handleRoleColor = () => {
        if (userData.role === 'admin') {
            return 'bg-[#00A3AD]'
        } else if (userData.role === 'hr') {
            return 'bg-[#C5A059]'
        }
    }

    const handleLogout = () => {
        window.location.href = '/home'
        localStorage.removeItem('userId')
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

                    <div className="flex flex-col gap-6 py-8 border-[#DDE2E5] border-y-1">
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
                        <button
                            type="submit"
                            className="text-[#F8F9FA] bg-[#024C89] hover:bg-[#3572A1] rounded-[8px] px-[16px] py-[4px] cursor-pointer"
                        >
                            Save Changes
                        </button>
                    </div>

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
