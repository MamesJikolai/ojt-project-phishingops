import { Outlet } from 'react-router-dom'

function UserLayout() {
    return (
        <main className="bg-[#F8F9FA] grow min-w-0 min-h-screen overflow-x-hidden">
            <div>
                <Outlet />
            </div>
        </main>
    )
}

export default UserLayout
