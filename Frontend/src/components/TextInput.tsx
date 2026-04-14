import React, { useRef } from 'react'

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    checkboxClass?: string
}

function TextInput({
    label,
    className = '',
    checkboxClass = '',
    ...props
}: TextInputProps) {
    const isChoose = props.type === 'checkbox' || props.type === 'radio'
    const inputRef = useRef<HTMLInputElement>(null)

    const handleWheel = () => {
        if (props.type === 'number') {
            if (inputRef.current) {
                inputRef.current.blur()
            }
        }
    }

    return (
        <label
            className={`flex ${props.type === 'file' && props.accept !== '.csv' && label === 'Thumbnail' ? 'flex-row items-center gap-2' : 'flex-col'} w-full`}
        >
            {!isChoose && label && (
                <span className="text-[#121212] font-medium">{label}</span>
            )}

            <div className="flex flex-row items-center gap-2">
                <input
                    ref={inputRef}
                    onWheel={handleWheel}
                    className={`text-[#4A4A4A] bg-#F8F9FA ${props.type === 'file' ? '' : 'border-2 border-[#DDE2E5] rounded-4xl px-4 py-1'} focus:outline-[#024C89] max-w-2xl ${className}`}
                    {...props}
                />
                {isChoose && label && (
                    <span
                        className={`text-[#121212] cursor-pointer ${checkboxClass}`}
                    >
                        {label}
                    </span>
                )}
            </div>
        </label>
    )
}

export default TextInput
