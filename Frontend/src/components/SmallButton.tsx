interface SmallButtonProps {
    label: string
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
}

function SmallButton({ label, onClick }: SmallButtonProps) {
    return (
        <button
            onClick={onClick}
            className="bg-[#024C89] hover:bg-[#3572A1] text-[12px] text-[#F8F9FA] rounded-[8px] mt-[4px] px-[8px] py-[4px] cursor-pointer"
        >
            {label}
        </button>
    )
}

export default SmallButton
