interface DefaultButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isPage?: false | true
}

function DefaultButton({
    className = '',
    children,
    isPage = false,
    ...props
}: DefaultButtonProps) {
    return (
        <button
            className={`${className} rounded-[8px] ${isPage ? 'border rounded p-1' : 'px-4 py-2'} cursor-pointer  transition-colors`}
            {...props}
        >
            {children}
        </button>
    )
}

export default DefaultButton
