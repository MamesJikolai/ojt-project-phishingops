import { Outlet } from 'react-router-dom'
import AdminSidebar from './components/AdminSidebar.tsx'

function Layout() {
    return (
        <div className="flex flex-row min-h-screen">
            <aside className="bg-[#F8F9FA] h-screen fixed">
                <AdminSidebar />
            </aside>

            <main className="bg-[#E6EDF3] grow ml-[240px] min-w-0 overflow-x-hidden">
                <div>
                    <Outlet />
                </div>
            </main>

            {/* <footer className="bg-emerald-600">
                <Footer />
            </footer> */}
        </div>
    )
}

export default Layout
