type DefaultButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>

function DefaultButton({
    className = '',
    children,
    ...props
}: DefaultButtonProps) {
    return (
        <button
            className={`text-[#F8F9FA] bg-[#024C89] hover:bg-[#3572A1] rounded-[8px] px-[16px] py-[4px] cursor-pointer ${className}`}
            {...props}
        >
            {children}
        </button>
    )
}

export default DefaultButton
