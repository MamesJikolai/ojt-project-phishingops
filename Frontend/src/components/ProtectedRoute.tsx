import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { Accounts } from '../types/models'
import { apiService } from '../services/userService'

interface ProtectedRouteProps {
    children: ReactNode
    allowedRoles?: string[]
}

function ProtectedRoute({
    children,
    allowedRoles = ['admin', 'hr'],
}: ProtectedRouteProps) {
    const [isLoading, setIsLoading] = useState(true)
    const [redirectPath, setRedirectPath] = useState<string | null>(null)

    useEffect(() => {
        const checkAccess = async () => {
            try {
                setIsLoading(true)
                const userId = localStorage.getItem('userId')

                // 1. Not logged in at all -> Send to Login
                if (!userId) {
                    setRedirectPath('/login')
                    return
                }

                // Fetch user data
                const fetchedData =
                    await apiService.getAll<Accounts>('accounts')
                const foundUser = fetchedData.find(
                    (u) => u.id === Number(userId)
                )

                if (!foundUser) {
                    setRedirectPath('/login')
                    return
                }

                // 2. Requires specific role, but user doesn't have it -> Send to Home
                if (!allowedRoles.includes(foundUser.role)) {
                    setRedirectPath('/home')
                    return
                }

                // If we reach this point, they are authorized!
                setRedirectPath(null)
            } catch (err) {
                console.error('Failed to verify account:', err)
                // Safe fallback: kick them out if the API fails
                setRedirectPath('/login')
            } finally {
                setIsLoading(false)
            }
        }

        checkAccess()
    }, [allowedRoles])

    // 3. Block rendering while checking (Prevents UI flashing)
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen text-gray-500">
                Checking authorization...
            </div>
        )
    }

    // 4. Execute the redirect if a path was set
    if (redirectPath) {
        return <Navigate to={redirectPath} replace />
    }

    // 5. Authorized -> Render the protected layout/page
    return <>{children}</>
}

export default ProtectedRoute
