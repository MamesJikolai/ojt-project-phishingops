import CourseCard from '../../components/CourseCard.tsx'
import Message from '../../components/Message.tsx'
import { courseList } from '../../assets/courses.ts'

import { useMemo } from 'react'
import NavigateButton from '../../components/NavigateButton.tsx'
import useMockData from '../../hook/useMockData.ts'
import BasicTable from '../../components/BasicTable.tsx'
import type { ColumnDef } from '@tanstack/react-table'
import type { Campaign } from './Campaigns.tsx'

function Dashboard() {
    const { data, error } = useMockData<Campaign>()

    // Define table columns to pass into table
    const columns = useMemo<ColumnDef<Campaign, any>[]>(
        () => [
            {
                accessorKey: 'name', // Accessor key for the "name" field from data object
                header: 'Name', // Column header
            },
            {
                accessorKey: 'status', // Accessor key for the "name" field from data object
                header: 'Status', // Column header
            },
            {
                accessorKey: 'target', // Accessor key for the "name" field from data object
                header: 'Target', // Column header
            },
            {
                accessorKey: 'date', // Accessor key for the "name" field from data object
                header: 'Date', // Column header
            },
            {
                accessorKey: 'completion', // Accessor key for the "name" field from data object
                header: 'Completion', // Column header
            },
        ],
        []
    )

    return (
        <div className="flex flex-col items-start p-8 overflow-x-hidden max-w-full">
            <Message text="Dashboard" />

            <h2>My Courses</h2>
            <div className="flex justify-start w-full overflow-x-auto gap-4 pb-4">
                {courseList.slice(0, 5).map((item, index) => (
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
            {error ? (
                <div>{error}</div>
            ) : data.length === 0 ? (
                <div>Loading...</div>
            ) : (
                <BasicTable data={data.slice(0, 5)} columns={columns} />
            )}
            <NavigateButton
                label="View All"
                href="/campaigns"
                customCSS="mb-[32px]"
            />
        </div>
    )
}

export default Dashboard
