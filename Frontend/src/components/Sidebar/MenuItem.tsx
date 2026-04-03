import { NavLink } from 'react-router-dom'

interface NavLinkItem {
    title: string
    link: string
    href: string
    hrefActive?: string // The "?" means this is optional
}

interface MenuItemProps {
    items: NavLinkItem[]
    onCloseMobile?: () => void
}

function MenuItem({ items, onCloseMobile }: MenuItemProps) {
    return (
        <div className="flex flex-col">
            {items.map(({ title, link, href, hrefActive }, index) => (
                <div key={index}>
                    <NavLink
                        to={link}
                        className={
                            ({ isActive }) =>
                                `flex flex-row items-center pl-4 py-4 ${isActive ? 'text-[#024C89] font-bold border-r-4 border-[#024C89]' : 'font-medium hover:bg-[#E6EDF3]'}` //Active : Inactive
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <img
                                    src={
                                        isActive && hrefActive
                                            ? hrefActive
                                            : href
                                    }
                                    alt={title}
                                    className="w-6 h-6 mr-2"
                                />
                                {title}
                            </>
                        )}
                    </NavLink>
                </div>
            ))}
        </div>
    )
}

export default MenuItem
