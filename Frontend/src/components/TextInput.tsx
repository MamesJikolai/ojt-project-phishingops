import React from 'react'

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string
}

function TextInput({ label, className = '', ...props }: TextInputProps) {
    const isCheckbox = props.type === 'checkbox'

    return (
        <label>
            {!isCheckbox && (
                <span className="text-[#121212] font-medium">{label}</span>
            )}

            <input
                className={`text-[#4A4A4A] bg-#F8F9FA border-2 border-[#DDE2E5] focus:outline-[#024C89] rounded-4xl px-4 max-w-2xl py-2 ${className}`}
                {...props}
            />

            {isCheckbox && <span className="text-[#121212]">{label}</span>}
        </label>
    )
}

export default TextInput
