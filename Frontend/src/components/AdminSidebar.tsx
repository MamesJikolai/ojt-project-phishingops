import { Link } from 'react-router-dom'
import MenuItem from './MenuItem.tsx'
import { Icons } from '../assets/icons.ts'

const navLinksTop = [
    {
        title: 'Dashboard',
        link: '/dashboard',
        href: Icons.dashboard,
        hrefActive: Icons.dashboardActive,
    },
    {
        title: 'Landing Page',
        link: '/landing-page',
        href: Icons.landing,
        hrefActive: Icons.landingActive,
    },
    {
        title: 'Templates',
        link: '/templates',
        href: Icons.template,
        hrefActive: Icons.templateActive,
    },
    {
        title: 'Campaigns',
        link: '/campaigns',
        href: Icons.campaigns,
        hrefActive: Icons.campaignsActive,
    },
    {
        title: 'User Management',
        link: '/users',
        href: Icons.users,
        hrefActive: Icons.usersActive,
    },
    {
        title: 'Courses',
        link: '/courses',
        href: Icons.courses,
        hrefActive: Icons.coursesActive,
    },
    {
        title: 'Analytics & Reports',
        link: '/analytics',
        href: Icons.analytics,
        hrefActive: Icons.analyticsActive,
    },
    {
        title: 'Settings',
        link: '/settings',
        href: Icons.settings,
        hrefActive: Icons.settingsActive,
    },
]

const navLinksBottom = [
    {
        title: 'Account',
        link: '/account',
        href: Icons.account,
        hrefActive: Icons.accountActive,
    },
]

function AdminSidebar() {
    const handleLogout = () => {
        localStorage.removeItem('userRole')
        window.location.href = '/home'
    }

    return (
        <div className="flex flex-col justify-between w-[240px] text-[#4A4A4A] h-full">
            <div>
                {/* logo */}
                <Link to="/dashboard">
                    <div className="bg-[#024C89] w-fill h-[120px] m-2"></div>
                </Link>

                {/* nav links */}
                <MenuItem items={navLinksTop} />
            </div>

            <div>
                <MenuItem items={navLinksBottom} />

                <button
                    onClick={handleLogout}
                    className="flex flex-row items-center w-full font-medium hover:bg-[#E6EDF3] pl-4 py-4 cursor-pointer"
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
