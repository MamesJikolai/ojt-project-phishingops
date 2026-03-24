interface MessageProps {
    text: string
    subtitle?: string
}

function Message({ text, subtitle }: MessageProps) {
    return (
        <>
            <h1
                className={`font-bold text-4xl text-gray-800 w-[100%] mt-4 ${subtitle ? 'mb-2' : 'mb-4'}`}
            >
                {text}
            </h1>
            <p className="text-[12px] mb-4">{subtitle}</p>
        </>
    )
}

export default Message
