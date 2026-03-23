import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'

interface ProtectedRouteProps {
    children: ReactNode
    allowedRoles?: string[]
}

function ProtectedRoute({
    children,
    allowedRoles = ['admin', 'hr'],
}: ProtectedRouteProps) {
    // 1. Grab the user state directly from your centralized context
    const { user, isLoading } = useAuth()

    // 2. Block rendering while the context is verifying the initial token
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen text-gray-500">
                Checking authorization...
            </div>
        )
    }

    // 3. Not logged in at all -> Send to Login
    if (!user) {
        return <Navigate to="/login" replace />
    }

    // 4. Requires specific role, but user doesn't have it -> Send to Home
    if (!allowedRoles.includes(user.role)) {
        return <Navigate to="/home" replace />
    }

    // 5. Authorized -> Render the protected layout/page
    return <>{children}</>
}

export default ProtectedRoute
