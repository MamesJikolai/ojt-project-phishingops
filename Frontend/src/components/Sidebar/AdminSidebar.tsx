import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MenuItem from './MenuItem.tsx'
import { Icons } from '../../assets/icons.ts'
import { apiService } from '../../services/userService.ts' // Make sure this path is correct
import type { Accounts } from '../../types/models.ts'

const navLinksTop = [
    {
        title: 'Dashboard',
        link: '/dashboard',
        href: Icons.dashboard,
        hrefActive: Icons.dashboardActive,
        allowedRoles: ['admin', 'hr'],
    },
    {
        title: 'Landing Page',
        link: '/landing-page',
        href: Icons.landing,
        hrefActive: Icons.landingActive,
        allowedRoles: ['admin'],
    },
    {
        title: 'Email Templates',
        link: '/templates',
        href: Icons.template,
        hrefActive: Icons.templateActive,
        allowedRoles: ['admin'],
    },
    {
        title: 'Campaigns',
        link: '/campaigns',
        href: Icons.campaigns,
        hrefActive: Icons.campaignsActive,
        allowedRoles: ['admin', 'hr'],
    },
    {
        title: 'User Management',
        link: '/users',
        href: Icons.users,
        hrefActive: Icons.usersActive,
        allowedRoles: ['admin'],
    },
    {
        title: 'Courses',
        link: '/courses',
        href: Icons.courses,
        hrefActive: Icons.coursesActive,
        allowedRoles: ['admin'],
    },
    {
        title: 'Analytics & Reports',
        link: '/analytics',
        href: Icons.analytics,
        hrefActive: Icons.analyticsActive,
        allowedRoles: ['admin', 'hr'],
    },
    {
        title: 'Settings',
        link: '/settings',
        href: Icons.settings,
        hrefActive: Icons.settingsActive,
        allowedRoles: ['admin'],
    },
]

const navLinksBottom = [
    {
        title: 'Account',
        link: '/account',
        href: Icons.account,
        hrefActive: Icons.accountActive,
        allowedRoles: ['admin', 'hr'],
    },
]

function AdminSidebar() {
    const [userRole, setUserRole] = useState<string>('')
    const [isLoading, setIsLoading] = useState(true)

    // Use React Router's navigate function instead of window.location
    const navigate = useNavigate()

    useEffect(() => {
        const fetchUserRole = async () => {
            try {
                const userId = localStorage.getItem('userId')
                if (!userId) return

                // Fetch the user data dynamically
                const fetchedAccounts =
                    await apiService.getAll<Accounts>('accounts')
                const currentUser = fetchedAccounts.find(
                    (u) => u.id === Number(userId)
                )

                if (currentUser) {
                    setUserRole(currentUser.role)
                }
            } catch (error) {
                console.error('Failed to fetch user role for sidebar:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchUserRole()
    }, [])

    // Filter links based on the fetched role
    const filteredNavLinksTop = navLinksTop.filter((link) =>
        link.allowedRoles.includes(userRole)
    )

    const filteredNavLinksBottom = navLinksBottom.filter((link) =>
        link.allowedRoles.includes(userRole)
    )

    const handleLogout = () => {
        localStorage.removeItem('userId')
        // Seamlessly redirect without reloading the whole browser tab
        navigate('/home')
    }

    // Optional: Show a skeleton or loading state so the sidebar doesn't flash empty
    if (isLoading) {
        return (
            <div className="w-[240px] h-full bg-[#F8F9FA] animate-pulse"></div>
        )
    }

    return (
        <div className="flex flex-col justify-between w-[240px] text-[#4A4A4A] h-full">
            <div>
                {/* logo */}
                <Link to="/dashboard">
                    <div className="bg-[#024C89] w-fill h-[120px] m-2"></div>
                </Link>

                {/* nav links */}
                <MenuItem items={filteredNavLinksTop} />
            </div>

            <div>
                <MenuItem items={filteredNavLinksBottom} />

                <button
                    onClick={handleLogout}
                    className="flex flex-row items-center w-full font-medium hover:bg-[#E6EDF3] pl-4 py-4 cursor-pointer transition-colors"
                >
                    <img
                        src={Icons.logout}
                        alt="Sign Out"
                        className="w-6 h-6 mr-2"
                    />
                    Sign Out
                </button>
            </div>
        </div>
    )
}

export default AdminSidebar
