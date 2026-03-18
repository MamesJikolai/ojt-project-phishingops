import React from 'react'

interface TextFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string
}

function TextField({ label, className = '', ...props }: TextFieldProps) {
    return (
        <label>
            <span className="font-medium text-[#121212]">{label}</span>
            <textarea
                className={`text-[#4A4A4A] bg-#F8F9FA border-2 border-[#DDE2E5] focus:outline-[#024C89] rounded-[16px] px-[12px] max-w-2xl py-1 ${className}`}
                {...props}
            >
                Template
            </textarea>
        </label>
    )
}

export default TextField
