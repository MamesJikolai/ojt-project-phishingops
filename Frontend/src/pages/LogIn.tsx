import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TextInput from '../components/TextInput.tsx'
import { useAuth } from '../context/AuthContext.tsx' // 1. Import your new hook
import { apiService } from '../services/userService.ts' // 2. Import the API service
import type { Accounts } from '../types/models.ts'

function LogIn() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [type, setType] = useState('password')
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false) // Added loading state

    const navigate = useNavigate()
    const { login } = useAuth() // 3. Destructure the login function from context

    const handleLogin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError('')
        setIsSubmitting(true)

        try {
            // 4. Fetch dynamic data instead of using the static import
            const fetchedAccounts =
                await apiService.getAll<Accounts>('accounts')

            // Note: When you move to Django, you will send the username/password
            // to the backend directly, rather than filtering on the frontend.
            const foundUser = fetchedAccounts.find(
                (u) => u.username === username && u.password === password
            )

            if (foundUser) {
                // 5. Use the context's login function so the whole app updates instantly
                await login(foundUser.id.toString())
                navigate('/dashboard')
            } else {
                setError('Invalid username or password')
            }
        } catch (err) {
            console.error('Failed to log in:', err)
            setError('Server error. Please try again later.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleToggle = () => {
        setType((prev) => (prev === 'password' ? 'text' : 'password'))
    }

    return (
        <div className="flex h-screen flex-col justify-center drop-shadow-md">
            <form
                onSubmit={handleLogin}
                className="flex flex-col gap-4 bg-[#FEF9FA] w-[90%] max-w-[600px] mx-auto px-[48px] py-[32px]"
            >
                <div className="flex flex-col gap-1">
                    <h1>Login</h1>
                    {error && <p className="text-rose-500">{error}</p>}
                </div>

                <TextInput
                    label="Username"
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full"
                    disabled={isSubmitting} // Disable inputs while loading
                />

                <TextInput
                    label="Password"
                    type={type}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full"
                    disabled={isSubmitting}
                />

                <TextInput
                    label="Show password"
                    type="checkbox"
                    onChange={handleToggle}
                    checked={type === 'text'}
                    className="accent-[#3572A1] mr-1 cursor-pointer"
                    disabled={isSubmitting}
                />

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="text-[#FFFAFA] bg-[#024C89] hover:bg-[#3572A1] py-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isSubmitting ? 'Logging in...' : 'Submit'}
                </button>
            </form>
        </div>
    )
}

export default LogIn
