interface NavigateButtonProps {
    label: string
    href: string
    customCSS?: string
}

function NavigateButton({ label, href, customCSS }: NavigateButtonProps) {
    return (
        <a
            className={`text-[#F8F9FA] bg-[#024C89] hover:bg-[#3572A1] rounded-[8px] mt-[16px] px-[16px] py-[4px] cursor-pointer ${customCSS}  transition-colors`}
            href={href}
        >
            {label}
        </a>
    )
}

export default NavigateButton
