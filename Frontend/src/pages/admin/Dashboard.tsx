import { useState, useEffect } from 'react'
import CourseCard from '../../components/CourseCard.tsx'
import Message from '../../components/Message.tsx'
import NavigateButton from '../../components/NavigateButton.tsx'
import type { ColumnDef } from '@tanstack/react-table'
import TableComponent from '../../components/Tables/TableComponent.tsx'
import type { Courses } from '../../types/models.ts'
import type { Campaign } from '../../types/models.ts'
import { apiService } from '../../services/userService.ts'

function Dashboard() {
    const [courseData, setCourseData] = useState<Courses[]>([])
    const [campaignData, setCampaignData] = useState<Campaign[]>([])
    const [loading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchTemplate = async () => {
            try {
                setIsLoading(true)
                const fetchedCampaignData =
                    await apiService.getAll<Campaign>('campaigns')
                const fetchedCoursesData =
                    await apiService.getAll<Courses>('courses')
                setCampaignData(fetchedCampaignData)
                setCourseData(fetchedCoursesData)
            } catch (err) {
                console.error('Failed to load data:', err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchTemplate()
    }, [])

    // Define table columns to pass into table
    const columns: ColumnDef<Campaign, any>[] = [
        { accessorKey: 'name', header: 'Name' },
        {
            accessorKey: 'status',
            header: 'Status',
            meta: { filterVariant: 'select' },
        },
        {
            accessorKey: 'target',
            header: 'Target',
            meta: { filterVariant: 'select' },
        },
        { accessorKey: 'date', header: 'Date', enableColumnFilter: false },
        {
            accessorKey: 'completion',
            header: 'Completion',
            enableColumnFilter: false,
            cell: (info) => {
                // Since your data type is already a number, we can just grab it directly!
                const numericValue = info.getValue() as number

                // Optional: Change color based on progress (red for low, green for high)
                let barColor = 'bg-[#28A745]' // Default Green
                if (numericValue < 30) {
                    barColor = 'bg-[#DC3545]' // Red for low completion
                } else if (numericValue < 70) {
                    barColor = 'bg-[#FFC107]' // Yellow for medium completion
                }

                return (
                    <div className="w-full min-w-[120px] px-1 flex items-center gap-3">
                        {/* Text Label (e.g., "65%") */}
                        <span className="w-fit text-right text-xs font-bold text-gray-700">
                            {numericValue}%
                        </span>

                        {/* The Gray Background Track */}
                        <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                            {/* The Colored Progress Fill */}
                            <div
                                className={`h-full ${barColor} rounded-full transition-all duration-700 ease-out`}
                                // The inline style sets the exact width dynamically
                                style={{ width: `${numericValue}%` }}
                            />
                        </div>
                    </div>
                )
            },
        },
    ]

    return (
        <div className="flex flex-col items-start p-8 overflow-x-hidden max-w-full">
            <Message text="Dashboard" />

            <h2>My Courses</h2>
            <div className="flex justify-start w-full overflow-x-auto gap-4 pb-4">
                {courseData.slice(0, 5).map((item, index) => (
                    <CourseCard
                        title={item.title}
                        caption={item.caption}
                        key={index}
                    />
                ))}
            </div>
            <NavigateButton
                label="View All"
                href="/courses"
                customCSS="mb-[32px]"
            />

            <h2>Analytics</h2>
            <div className="flex justify-start w-full overflow-x-auto gap-4 pb-4">
                <div className="bg-red-200 w-[300px] h-[300px] shrink-0"></div>
                <div className="bg-red-200 w-[300px] h-[300px] shrink-0"></div>
                <div className="bg-red-200 w-[300px] h-[300px] shrink-0"></div>
                <div className="bg-red-200 w-[300px] h-[300px] shrink-0"></div>
                <div className="bg-red-200 w-[300px] h-[300px] shrink-0"></div>
            </div>
            <NavigateButton
                label="View All"
                href="/analytics"
                customCSS="mb-[32px]"
            />

            <h2>Campaign</h2>
            <TableComponent
                data={campaignData.slice(0, 5)}
                columns={columns}
                isPaginated={false}
            />
            <NavigateButton
                label="View All"
                href="/campaigns"
                customCSS="mb-[32px]"
            />
        </div>
    )
}

export default Dashboard
