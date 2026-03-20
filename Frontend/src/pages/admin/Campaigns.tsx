import { useState, useCallback, useEffect, useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import Message from '../../components/Message.tsx'
import CampaignModal from '../../components/Campaigns/CampaignModal.tsx'
import DefaultButton from '../../components/DefaultButton.tsx'
import TableComponent from '../../components/Tables/TableComponent.tsx'
import type { Campaign } from '../../types/models.ts'
import { apiService } from '../../services/userService.ts'
import { useAuth } from '../../context/AuthContext.tsx' // 1. Import your Auth hook!

function Campaigns() {
    // 2. Grab the logged-in user directly from context
    const { user } = useAuth()
    const userRole = user?.role || ''

    const [data, setData] = useState<Campaign[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
        null
    )

    useEffect(() => {
        const fetchCampaign = async () => {
            try {
                setIsLoading(true)
                const fetchedData =
                    await apiService.getAll<Campaign>('campaigns')
                setData(fetchedData)
            } catch (err) {
                console.error('Failed to load campaign:', err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchCampaign()
    }, [])

    const openCreateModal = useCallback(() => {
        setModalMode('create')
        setSelectedCampaign(null)
        setIsModalOpen(true)
    }, [])

    const openEditModal = useCallback((campaignData: Campaign) => {
        setModalMode('edit')
        setSelectedCampaign(campaignData)
        setIsModalOpen(true)
    }, [])

    const handleDeleteCampaign = useCallback(async (campaignData: Campaign) => {
        const confirmDelete = window.confirm(
            `Are you sure you want to delete "${campaignData.name}"?`
        )
        if (confirmDelete) {
            try {
                await apiService.delete('campaigns', campaignData.id)
                setData((prev: Campaign[]) =>
                    prev.filter((item) => item.id !== campaignData.id)
                )
            } catch (err) {
                console.error('Failed to delete campaign:', err)
            }
        }
    }, [])

    const handleLaunchCampaign = () => {
        // Implementation for later
    }

    const handleSaveCampaign = async (campaignData: Campaign) => {
        try {
            if (modalMode === 'edit') {
                const updatedCampaign = await apiService.update<Campaign>(
                    'campaigns',
                    campaignData.id,
                    campaignData
                )
                setData((prev: Campaign[]) =>
                    prev.map((item) =>
                        item.id === updatedCampaign.id ? updatedCampaign : item
                    )
                )
            } else if (modalMode === 'create') {
                const newCampaign = await apiService.create<Campaign>(
                    'campaigns',
                    campaignData
                )
                setData((prevData: Campaign[]) => [newCampaign, ...prevData])
            }
        } catch (err) {
            console.error('Failed to save campaign:', err)
        }
    }

    // 3. Wrapping columns in useMemo is a best practice for TanStack Table
    // to prevent unnecessary re-renders when data changes.
    const columns = useMemo<ColumnDef<Campaign, any>[]>(
        () => [
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
            {
                accessorKey: 'template',
                header: 'Template',
            },
            { accessorKey: 'date', header: 'Date', enableColumnFilter: false },
            {
                accessorKey: 'completion',
                header: 'Completion',
                enableColumnFilter: false,
                cell: (info) => {
                    const numericValue = info.getValue() as number
                    let barColor = 'bg-[#28A745]'
                    if (numericValue < 30) {
                        barColor = 'bg-[#DC3545]'
                    } else if (numericValue < 70) {
                        barColor = 'bg-[#FFC107]'
                    }

                    return (
                        <div className="w-full min-w-[120px] px-1 flex items-center gap-3">
                            <span className="w-fit text-right text-xs font-bold text-gray-700">
                                {numericValue}%
                            </span>
                            <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                                <div
                                    className={`h-full ${barColor} rounded-full transition-all duration-700 ease-out`}
                                    style={{ width: `${numericValue}%` }}
                                />
                            </div>
                        </div>
                    )
                },
            },
            {
                id: 'actions',
                header: 'Actions',
                cell: (info) => {
                    const campaignData = info.row.original
                    return (
                        <div className="flex flex-row gap-2 text-[12px]">
                            <button
                                onClick={handleLaunchCampaign}
                                className="text-[#F8F9FA] hover:bg-[#45C664] bg-[#28A745] px-2 rounded-md py-1 font-bold cursor-pointer"
                            >
                                ▶︎ Launch
                            </button>
                            <button
                                onClick={() => openEditModal(campaignData)}
                                className="hover:text-[#17A2B8] text-[#4ECFE0] font-bold cursor-pointer"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() =>
                                    handleDeleteCampaign(campaignData)
                                }
                                className="hover:text-[#DC3545] text-[#FF6B6B] font-bold cursor-pointer"
                            >
                                Delete
                            </button>
                        </div>
                    )
                },
            },
        ],
        [handleDeleteCampaign, openEditModal]
    ) // Dependencies for useMemo

    // 4. Your perfectly written logic!
    const visibleColumns =
        userRole === 'hr'
            ? columns.filter((col) => col.id !== 'actions')
            : columns

    return (
        <div className="flex flex-col items-start m-8">
            <Message text="Campaigns" />

            {userRole !== 'hr' && (
                <DefaultButton
                    className="bg-[#024C89] hover:bg-[#3572A1] text-[#F8F9FA] mb-4"
                    onClick={openCreateModal}
                    children="Create Campaign"
                />
            )}

            {/* Show loading state or table */}
            {isLoading ? (
                <div className="py-8 text-gray-500 animate-pulse">
                    Loading campaigns...
                </div>
            ) : (
                <TableComponent data={data} columns={visibleColumns} />
            )}

            {isModalOpen && (
                <CampaignModal
                    key={
                        selectedCampaign ? selectedCampaign.id : 'create-modal'
                    }
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    mode={modalMode}
                    initialData={selectedCampaign}
                    onSave={handleSaveCampaign}
                />
            )}
        </div>
    )
}

export default Campaigns
