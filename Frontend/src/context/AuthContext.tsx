import {
    createContext,
    useContext,
    useState,
    useEffect,
    type ReactNode,
} from 'react'
import { apiService } from '../services/userService'
import type { AuthUser } from '../types/models'

interface AuthContextType {
    user: AuthUser | null
    isLoading: boolean
    login: (userData: AuthUser) => void
    logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const initializeAuth = async () => {
            const token = localStorage.getItem('access_token')

            if (token) {
                try {
                    const userData = await apiService.getMe()

                    // Derive the role on page refresh ---
                    let derivedRole = 'user'
                    if (userData.is_superuser) {
                        derivedRole = 'admin'
                    } else if (userData.is_staff) {
                        derivedRole = 'hr'
                    }

                    // Inject the role before setting the state
                    const userWithRole = {
                        ...userData,
                        role: derivedRole,
                    }

                    setUser(userWithRole)
                } catch (error) {
                    console.error('Session expired or invalid token:', error)
                    localStorage.removeItem('access_token')
                    localStorage.removeItem('refresh_token')
                }
            }
            setIsLoading(false)
        }

        initializeAuth()
    }, [])

    const login = (userData: AuthUser) => {
        setUser(userData)
    }

    const logout = () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

// Add this comment to tell Vite this export is intentionally a hook
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
