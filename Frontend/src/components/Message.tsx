function Message({ text }: { text: string }) {
    return (
        <h1 className="font-bold text-4xl text-gray-800 w-[100%] pb-8">
            {text}
        </h1>
    )
}

export default Message
