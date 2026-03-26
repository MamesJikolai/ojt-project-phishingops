import { useState, useCallback, useEffect, useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import Message from '../../components/Message.tsx'
import CampaignModal from '../../components/Campaigns/CampaignModal.tsx'
import DefaultButton from '../../components/DefaultButton.tsx'
import TableComponent from '../../components/Tables/TableComponent.tsx'
import type { Campaign } from '../../types/models.ts'
import { apiService } from '../../services/userService.ts'
import { useAuth } from '../../context/AuthContext.tsx'
import { formatDate } from '../../utils/formatters.ts'

function Campaigns() {
    const { user } = useAuth()
    const userRole = user?.role || ''

    const [data, setData] = useState<Campaign[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
        null
    )

    const fetchCampaign = useCallback(async () => {
        try {
            setIsLoading(true)
            const fetchedData = await apiService.getAll<Campaign>('campaigns')
            setData(fetchedData)
        } catch (err) {
            console.error('Failed to load campaign:', err)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchCampaign()
    }, [fetchCampaign])

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

    const handleSaveCampaign = async (
        campaignData: Partial<Campaign>,
        file: File | null
    ) => {
        try {
            // 1. Split the data
            const {
                smtp_host,
                smtp_port,
                smtp_user,
                smtp_password,
                smtp_use_ssl,
                smtp_use_tls,
                from_email,
                ...coreData
            } = campaignData

            const smtpData = {
                smtp_host,
                smtp_port,
                smtp_user,
                smtp_password,
                smtp_use_ssl,
                smtp_use_tls,
                from_email,
            }

            if (modalMode === 'edit') {
                // Update core campaign
                const updatedCampaign = await apiService.update<Campaign>(
                    'campaigns',
                    coreData.id!,
                    coreData
                )
                // Update SMTP settings
                await apiService.updateCampaignSmtp(
                    updatedCampaign.id,
                    smtpData
                )

                if (file) {
                    await apiService.uploadCsv(updatedCampaign.id, file)
                }
                fetchCampaign()
            } else if (modalMode === 'create') {
                // Create core campaign
                const newCampaign = await apiService.create<Campaign>(
                    'campaigns',
                    coreData
                )
                // Update SMTP settings using the newly generated ID
                await apiService.updateCampaignSmtp(newCampaign.id, smtpData)

                if (file) {
                    await apiService.uploadCsv(newCampaign.id, file)
                }
                fetchCampaign()
            }
        } catch (err) {
            console.error('Failed to save campaign or upload CSV:', err)
            alert('An error occurred while saving the campaign.')
        }
    }

    const columns = useMemo<ColumnDef<Campaign, any>[]>(
        () => [
            { accessorKey: 'name', header: 'Name' },
            {
                accessorKey: 'status',
                header: 'Status',
                meta: { filterVariant: 'select' },
                // Optional: Capitalize the status (e.g., "running" -> "Running")
                cell: (info) => (
                    <span className="capitalize">
                        {info.getValue() as string}
                    </span>
                ),
            },
            {
                accessorKey: 'total_targets', // Changed from 'target'
                header: 'Targets',
                enableColumnFilter: false,
            },
            {
                accessorKey: 'email_template_name', // Changed from 'template'
                header: 'Template',
                cell: (info) =>
                    info.getValue() || (
                        <span className="text-gray-400 italic">None</span>
                    ),
            },
            {
                accessorKey: 'scheduled_at', // Changed from 'date'
                header: 'Scheduled',
                enableColumnFilter: false,
                cell: (info) => formatDate(info.getValue() as string),
            },
            {
                accessorKey: 'created_at', // Changed from 'date'
                header: 'Created',
                enableColumnFilter: false,
                cell: (info) => formatDate(info.getValue() as string),
            },
            {
                accessorKey: 'click_rate', // Changed from 'completion'
                header: 'Click Rate',
                enableColumnFilter: false,
                cell: (info) => {
                    const numericValue = info.getValue() as number
                    let barColor = 'bg-[#DC3545]'
                    if (numericValue <= 20) {
                        barColor = 'bg-[#28A745]'
                    } else if (numericValue <= 40) {
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
                                onClick={async () => {
                                    try {
                                        await apiService.launchCampaign(
                                            campaignData.id
                                        )
                                        alert('Campaign launched successfully!')
                                    } catch (err: any) {
                                        alert(
                                            err.response?.data?.error ||
                                                'Failed to launch.'
                                        )
                                    }
                                }}
                                disabled={
                                    campaignData.status.toLowerCase() !==
                                    'draft'
                                } // Only allow drafting
                                className="text-[#F8F9FA] hover:bg-[#45C664] bg-[#28A745] px-2 rounded-md py-1 font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {campaignData.status.toLowerCase() === 'running'
                                    ? 'Running'
                                    : '▶︎ Launch'}
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
