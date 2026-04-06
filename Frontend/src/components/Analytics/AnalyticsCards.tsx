interface AnalyticsCardsProps {
    text: string
    item: number
}

function AnalyticsCards({ text, item }: AnalyticsCardsProps) {
    const isPercentage = (label: string) => {
        if (
            label.toLowerCase().includes('rate') ||
            label.toLowerCase().includes('score')
        ) {
            return '%'
        }

        return null
    }

    return (
        <div className="flex flex-col bg-[#F8F9FA] w-[120px] rounded-2xl p-4 shrink-0 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 drop-shadow-md">
            <p className="text-[32px]">
                {item}
                {isPercentage(text)}
            </p>
            <p className="text-[12px]">{text}</p>
        </div>
    )
}

export default AnalyticsCards
