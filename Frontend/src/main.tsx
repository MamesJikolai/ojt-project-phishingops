import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout from './Layout.tsx'
import UserLayout from './UserLayout.tsx'
import Dashboard from './pages/admin/Dashboard.tsx'
import Home from './pages/user/Home.tsx'
import Courses from './pages/admin/Courses.tsx'
import MyCourses from './pages/user/MyCourses.tsx'
import Settings from './pages/admin/Settings.tsx'
import Campaigns from './pages/admin/Campaigns.tsx'
import Analytics from './pages/admin/Analytics.tsx'
import Notifications from './pages/admin/Notifications.tsx'
import Account from './pages/admin/Account.tsx'
import Users from './pages/admin/Users.tsx'
import LogIn from './pages/LogIn.tsx'
import PhishingPage from './pages/PhishingPage.tsx'
import LandingPage from './pages/admin/LandingPage.tsx'
import Templates from './pages/admin/Templates.tsx'
import ProtectedRoute from './components/ProtectedRoute.tsx'

const router = createBrowserRouter([
    {
        path: '/login',
        element: <LogIn />,
    },
    {
        // Pathless route: applies UserLayout and basic auth to all children
        element: <UserLayout />,
        children: [
            {
                path: '/',
                element: <PhishingPage />,
            },
            {
                path: '/home',
                element: <Home />,
            },
            {
                path: '/my-courses',
                element: <MyCourses />,
            },
        ],
    },
    {
        // Pathless route: applies Layout and strict admin auth to all children
        element: (
            <ProtectedRoute requireAdmin={true}>
                <Layout />
            </ProtectedRoute>
        ),
        children: [
            {
                path: '/dashboard',
                element: <Dashboard />,
            },
            {
                path: '/landing-page',
                element: <LandingPage />,
            },
            {
                path: '/templates',
                element: <Templates />,
            },
            {
                path: '/campaigns',
                element: <Campaigns />,
            },
            {
                path: '/users',
                element: <Users />,
            },
            {
                path: '/courses',
                element: <Courses />,
            },
            {
                path: '/analytics',
                element: <Analytics />,
            },
            {
                path: '/settings',
                element: <Settings />,
            },
            {
                path: '/notifications',
                element: <Notifications />,
            },
            {
                path: '/account',
                element: <Account />,
            },
        ],
    },
])

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>
)
