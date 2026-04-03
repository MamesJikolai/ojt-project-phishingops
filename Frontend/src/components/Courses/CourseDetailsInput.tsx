import React from 'react'

interface CourseDetailsInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    checkboxClass?: string
}

function CourseDetailsInput({
    label,
    checkboxClass,
    className = '',
    ...props
}: CourseDetailsInputProps) {
    const isCheckbox = props.type === 'checkbox'

    return (
        <label
            className={`flex ${props.type === 'file' ? 'flex-row items-center gap-2 w-fit' : 'flex-col w-full'}`}
        >
            {!isCheckbox && (
                <span className="text-[#121212] font-medium">{label}</span>
            )}

            <div>
                <input
                    className={`${props.type !== 'file' && 'text-[#121212] border border-[#121212] focus:outline-[#024C89] rounded-md px-4 py-1'} ${className}`}
                    {...props}
                />
                {isCheckbox && (
                    <span className={`text-[#121212] ${checkboxClass}`}>
                        {label}
                    </span>
                )}
            </div>
        </label>
    )
}

export default CourseDetailsInput
