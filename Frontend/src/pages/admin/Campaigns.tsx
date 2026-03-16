import Message from '../../components/Message.tsx'
import SearchBar from '../../components/SearchBar.tsx'
import CampaignModal from '../../components/CampaignModal.tsx' // Updated import
import DefaultButton from '../../components/DefaultButton.tsx'

import { useMemo, useState, useCallback } from 'react'
import useMockData from '../../hook/useMockData.ts'
import BasicTable from '../../components/BasicTable.tsx'
import type { ColumnDef } from '@tanstack/react-table'

export type Campaign = {
    id: number
    name: string
    status: string
    target: string
    date: string
    completion: string
    subject: string
    body: string
}

function Campaigns() {
    const { data, setData, error } = useMockData<Campaign>()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [modalMode, setModalMode] = useState<'create' | 'view' | 'edit'>(
        'create'
    )
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
        null
    )

    const openCreateModal = useCallback(() => {
        setModalMode('create')
        setSelectedCampaign(null)
        setIsModalOpen(true)
    }, [])

    const openViewModal = useCallback((campaignData: Campaign) => {
        setModalMode('view')
        setSelectedCampaign(campaignData)
        setIsModalOpen(true)
    }, [])

    const openEditModal = useCallback((campaignData: Campaign) => {
        setModalMode('edit')
        setSelectedCampaign(campaignData)
        setIsModalOpen(true)
    }, [])

    const deleteRowData = useCallback(
        (campaignData: Campaign) => {
            const confirmDelete = window.confirm(
                `Are you sure you want to delete "${campaignData.name}"?`
            )
            if (confirmDelete) {
                setData((prevData: Campaign[]) =>
                    prevData.filter((item) => item.id !== campaignData.id)
                )
            }
        },
        [setData]
    ) // setData goes in here because the function uses it

    const handleSaveCampaign = (savedCampaign: Campaign) => {
        if (modalMode === 'edit') {
            // Find the old campaign in the array and replace it with the new one
            setData((prevData: Campaign[]) =>
                prevData.map((item) =>
                    item.id === savedCampaign.id ? savedCampaign : item
                )
            )
        } else if (modalMode === 'create') {
            // Add the brand new campaign to the top of the list
            setData((prevData: Campaign[]) => [savedCampaign, ...prevData])
        }
    }

    // Define table columns
    const columns = useMemo<ColumnDef<Campaign>[]>(
        () => [
            { accessorKey: 'name', header: 'Name' },
            { accessorKey: 'status', header: 'Status' },
            { accessorKey: 'target', header: 'Target' },
            { accessorKey: 'date', header: 'Date' },
            { accessorKey: 'completion', header: 'Completion' },
            {
                id: 'actions',
                header: 'Actions',
                cell: (info) => {
                    const campaignData = info.row.original

                    return (
                        <div className="flex flex-row gap-2">
                            <button
                                onClick={() => openViewModal(campaignData)}
                                className="hover:text-[#17A2B8] text-[#4ECFE0] font-bold cursor-pointer"
                            >
                                View
                            </button>
                            <button
                                onClick={() => openEditModal(campaignData)}
                                className="hover:text-[#28A745] text-[#45C664] font-bold cursor-pointer"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => deleteRowData(campaignData)}
                                className="hover:text-[#DC3545] text-[#FF6B6B] font-bold cursor-pointer"
                            >
                                Delete
                            </button>
                        </div>
                    )
                },
            },
        ],
        [openViewModal, openEditModal, deleteRowData]
    )

    if (error) return <div>{error}</div>
    if (data.length === 0) return <div>Loading...</div>

    return (
        <div className="flex flex-col items-start m-8">
            <SearchBar />
            <Message text="Campaigns" />

            {/* The Create button now lives here, passing control to the states */}
            <DefaultButton
                className="mb-[16px] mt-[16px]"
                onClick={openCreateModal}
                children="Create Campaign"
            />

            <BasicTable<Campaign> data={data} columns={columns} />

            {isModalOpen && (
                <CampaignModal
                    key={
                        selectedCampaign ? selectedCampaign.id : 'create-modal'
                    }
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    mode={modalMode}
                    initialData={selectedCampaign}
                    onSave={handleSaveCampaign} // 3. Pass the function down to the modal!
                />
            )}
        </div>
    )
}

export default Campaigns
