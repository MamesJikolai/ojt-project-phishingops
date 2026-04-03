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

    const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
        if (props.type === 'number') {
            // Prevent the default scrolling behavior on the input
            e.preventDefault()

            // Remove focus from the input so the scroll applies to the page/modal instead
            if (inputRef.current) {
                inputRef.current.blur()
            }
        }
    }

    return (
        <label
            className={`flex ${props.type === 'file' && props.accept !== '.csv' ? 'flex-row items-center gap-2 pt-4' : 'flex-col'} ${isChoose ? 'w-fit' : 'w-full'}`}
        >
            {!isChoose && label && (
                <span className="text-[#121212] font-medium">{label}</span>
            )}

            <div className="flex flex-row items-center gap-2">
                <input
                    ref={inputRef}
                    onWheel={handleWheel}
                    className={`text-[#4A4A4A] bg-#F8F9FA border-2 border-[#DDE2E5] focus:outline-[#024C89] rounded-4xl px-4 max-w-2xl py-1 ${className}`}
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
