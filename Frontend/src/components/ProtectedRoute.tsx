import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'

interface ProtectedRouteProps {
    children: ReactNode
    requireAdmin?: boolean
}

function ProtectedRoute({
    children,
    requireAdmin = false,
}: ProtectedRouteProps) {
    const userRole = localStorage.getItem('userRole')

    // 1. Not logged in at all -> Send to Login
    if (!userRole) {
        return <Navigate to="/login" replace />
    }

    // 2. Requires admin, but user is something else -> Send to User Home
    if (requireAdmin && userRole !== 'admin') {
        return <Navigate to="/home" replace />
    }

    // 3. Authorized -> Render the protected layout/page
    return <>{children}</>
}

export default ProtectedRoute
