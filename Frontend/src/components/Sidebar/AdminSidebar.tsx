import { Link, useNavigate } from 'react-router-dom'
import MenuItem from './MenuItem.tsx'
import { Icons } from '../../assets/icons.ts'
import { useAuth } from '../../context/AuthContext.tsx'

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
        allowedRoles: ['admin', 'hr'],
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

interface AdminSidebarProps {
    onCloseMobile?: () => void
}

function AdminSidebar({ onCloseMobile }: AdminSidebarProps) {
    const { user, logout } = useAuth()
    const userRole = user?.role || ''
    const navigate = useNavigate()

    // Filter links based on the fetched role
    const filteredNavLinksTop = navLinksTop.filter((link) =>
        link.allowedRoles.includes(userRole)
    )

    const filteredNavLinksBottom = navLinksBottom.filter((link) =>
        link.allowedRoles.includes(userRole)
    )

    const handleLogout = () => {
        navigate('/home')
        if (onCloseMobile) onCloseMobile()

        setTimeout(() => {
            logout()
        }, 200)
    }

    return (
        <div className="flex flex-col justify-between w-[240px] text-[#4A4A4A] min-h-full shadow-lg md:shadow-none">
            <div>
                {/* logo */}
                <Link to="/dashboard" onClick={onCloseMobile}>
                    <img
                        src="../../../public/PhishingOps.png"
                        width="auto"
                        height="120px"
                        className="m-2 items-center justify-center"
                    />
                </Link>

                {/* nav links */}
                <MenuItem
                    items={filteredNavLinksTop}
                    onCloseMobile={onCloseMobile}
                />
            </div>

            <div>
                <MenuItem
                    items={filteredNavLinksBottom}
                    onCloseMobile={onCloseMobile}
                />

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
