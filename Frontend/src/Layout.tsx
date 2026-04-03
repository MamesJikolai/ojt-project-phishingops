import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import AdminSidebar from './components/Sidebar/AdminSidebar.tsx'

function Layout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    return (
        <div className="flex flex-col md:flex-row min-h-screen relative">
            {/* Mobile Header - Only visible on small screens */}
            <div className="md:hidden bg-[#024C89] w-full h-16 flex items-center justify-between px-4 fixed top-0 z-40">
                <div className="text-[#F8F9FA] font-bold">
                    Phishing Platform
                </div>{' '}
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="text-[#F8F9FA] p-2 focus:outline-none"
                >
                    {/* Hamburger Icon */}
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 6h16M4 12h16M4 18h16"
                        />
                    </svg>
                </button>
            </div>

            {/* Mobile Overlay - Darkens background when sidebar is open */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                bg-[#F8F9FA] h-screen fixed top-0 left-0 z-50 w-[240px] 
                transition-transform duration-300 ease-in-out
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
                md:translate-x-0 overflow-y-auto
            `}
            >
                <AdminSidebar
                    onCloseMobile={() => setIsMobileMenuOpen(false)}
                />
            </aside>

            {/* Main Content Area */}
            <main className="bg-[#E6EDF3] grow min-w-0 min-h-screen overflow-x-hidden pt-16 md:pt-0 md:ml-[240px]">
                <div>
                    <Outlet />
                </div>
            </main>
        </div>
    )
}

export default Layout
