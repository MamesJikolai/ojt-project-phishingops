import Message from '../components/Message.tsx'
import SearchBar from '../components/SearchBar.tsx'
import DefaultButton from '../components/DefaultButton.tsx'

import { useMemo } from 'react'
import useMockData from '../hook/useMockData.ts'
import BasicTable from '../components/BasicTable.tsx'
import type { ColumnDef } from '@tanstack/react-table'

type Campaign = {
    name: string
    status: string
    target: string
    date: string
    completion: string
}

function Campaigns() {
    const { data, error } = useMockData()

    // Define table columns to pass into table
    const columns = useMemo<ColumnDef<Campaign>[]>(
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

    if (error) return <div>{error}</div>
    if (data.length === 0) return <div>Loading...</div>

    return (
        <div className="flex flex-col items-start m-8">
            <SearchBar />
            <Message text="Campaigns" />
            <DefaultButton label="Create Campaign" customCSS="mb-[16px]" />
            <BasicTable data={data} columns={columns} />
        </div>
    )
}

export default Campaigns
