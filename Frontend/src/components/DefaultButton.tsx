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
            className={`${className} rounded-[8px] ${isPage ? 'border rounded p-1' : 'px-[16px] py-[4px]'} cursor-pointer  transition-colors`}
            {...props}
        >
            {children}
        </button>
    )
}

export default DefaultButton
