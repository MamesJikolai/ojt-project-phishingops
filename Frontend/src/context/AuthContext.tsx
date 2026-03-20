import {
    createContext,
    useContext,
    useState,
    useEffect,
    type ReactNode,
} from 'react'
import { apiService } from '../services/userService'
import type { Accounts } from '../types/models'

interface AuthContextType {
    user: Accounts | null
    isLoading: boolean
    login: (userId: string) => Promise<void>
    logout: () => void
}

// 1. Initialize the Context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// 2. Create the Provider Component
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<Accounts | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Run THIS once when the app first loads
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const storedUserId = localStorage.getItem('userId')

                if (storedUserId) {
                    // Fetch all accounts (Later, change this to a /api/me/ endpoint in Django)
                    const fetchedData =
                        await apiService.getAll<Accounts>('accounts')
                    const foundUser = fetchedData.find(
                        (u) => u.id === Number(storedUserId)
                    )

                    if (foundUser) {
                        setUser(foundUser)
                    } else {
                        // Invalid ID in storage, clean it up
                        localStorage.removeItem('userId')
                    }
                }
            } catch (error) {
                console.error('Auth initialization failed:', error)
            } finally {
                setIsLoading(false)
            }
        }

        initializeAuth()
    }, [])

    // 3. Centralize your Login/Logout logic
    const login = async (userId: string) => {
        localStorage.setItem('userId', userId)
        // Force a re-fetch of the user data to populate the context
        setIsLoading(true)
        try {
            const fetchedData = await apiService.getAll<Accounts>('accounts')
            const foundUser = fetchedData.find((u) => u.id === Number(userId))
            setUser(foundUser || null)
        } finally {
            setIsLoading(false)
        }
    }

    const logout = () => {
        localStorage.removeItem('userId')
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

// 4. Create a custom hook for super easy consumption!
export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
