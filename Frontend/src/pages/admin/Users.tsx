import { useState, useEffect, useMemo, useCallback } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import Message from '../../components/Message.tsx'
import TableComponent from '../../components/Tables/TableComponent.tsx'
import type { User } from '../../types/models.ts'
import { apiService } from '../../services/userService.ts'
import UserModal from '../../components/Users/UserModal.tsx'
import DefaultButton from '../../components/DefaultButton.tsx'
import { formatDate } from '../../utils/formatters.ts'
import CsvUploadModal from '../../components/Users/CSVModal.tsx'

function Users() {
    const [data, setData] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isCsvModalOpen, setIsCsvModalOpen] = useState(false)
    const [selectedUser, setSelectedCUser] = useState<User | null>(null)

    const fetchUser = useCallback(async () => {
        try {
            setIsLoading(true)
            const fetchedData = await apiService.getAll<User>('targets')

            const sortedData = fetchedData.sort((a, b) => b.id - a.id)

            setData(sortedData)
        } catch (err) {
            console.error('Failed to load user:', err)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchUser()
    }, [fetchUser])

    const openEditModal = useCallback((userData: User) => {
        setSelectedCUser(userData)
        setIsModalOpen(true)
    }, [])

    const handleDeleteUser = async (userData: User) => {
        const confirmDelete = window.confirm(
            `Are you sure you want to delete "${userData.full_name}"?`
        )
        if (confirmDelete) {
            try {
                await apiService.delete('targets', userData.id)

                setData((prev: User[]) =>
                    prev.filter((item) => item.id !== userData.id)
                )
            } catch (err) {
                console.error('Failed to delete user:', err)
            }
        }
    }

    const handleSaveUser = async (userData: Partial<User>) => {
        try {
            const updatedUser = await apiService.update<User>(
                `campaigns/${userData.campaign}/targets`,
                userData.id!,
                userData,
                'PATCH'
            )

            setData((prev: User[]) =>
                prev.map((item) =>
                    item.id === updatedUser.id ? updatedUser : item
                )
            )
        } catch (err) {
            console.error('Failed to save user:', err)
        }
    }

    const columns = useMemo<ColumnDef<User, any>[]>(
        () => [
            { accessorKey: 'full_name', header: 'Name' },
            { accessorKey: 'email', header: 'Email' },
            { accessorKey: 'business_unit', header: 'Business Unit' },
            {
                accessorKey: 'department',
                header: 'Department',
            },
            {
                accessorKey: 'manager',
                header: 'Manager',
            },
            {
                accessorKey: 'manager_email',
                header: 'Manager Email',
            },
            {
                accessorKey: 'campaign_name',
                header: 'Campaign',
                meta: { filterVariant: 'select' },
            },
            {
                id: 'email_sent_at',
                header: 'Email Sent',
                enableColumnFilter: false,
                accessorFn: (row) =>
                    row.email_sent_at ? formatDate(row.email_sent_at) : '-',
                sortingFn: (rowA, rowB) => {
                    const a = new Date(
                        rowA.original.email_sent_at || 0
                    ).getTime()
                    const b = new Date(
                        rowB.original.email_sent_at || 0
                    ).getTime()
                    return a - b
                },
            },
            {
                id: 'link_clicked_at',
                header: 'Email Clicked',
                enableColumnFilter: false,
                accessorFn: (row) =>
                    row.link_clicked_at ? formatDate(row.link_clicked_at) : '-',
                sortingFn: (rowA, rowB) => {
                    const a = new Date(
                        rowA.original.link_clicked_at || 0
                    ).getTime()
                    const b = new Date(
                        rowB.original.link_clicked_at || 0
                    ).getTime()
                    return a - b
                },
            },
            {
                id: 'lms_completed_at',
                header: 'LMS Completed',
                enableColumnFilter: false,
                accessorFn: (row) =>
                    row.lms_completed_at
                        ? formatDate(row.lms_completed_at)
                        : '-',
                sortingFn: (rowA, rowB) => {
                    const a = new Date(
                        rowA.original.lms_completed_at || 0
                    ).getTime()
                    const b = new Date(
                        rowB.original.lms_completed_at || 0
                    ).getTime()
                    return a - b
                },
            },
            {
                id: 'quiz_score',
                header: 'Score',
                enableColumnFilter: false,
                accessorFn: (row) =>
                    row.quiz_score !== null ? String(row.quiz_score) : '-',
                sortingFn: (rowA, rowB) => {
                    const a = rowA.original.quiz_score ?? -1
                    const b = rowB.original.quiz_score ?? -1
                    return a - b
                },
            },
            {
                accessorKey: 'actions',
                header: 'Actions',
                enableColumnFilter: false,
                cell: (info) => {
                    const userData = info.row.original

                    return (
                        <div className="flex flex-row gap-2 text-[12px]">
                            <button
                                onClick={() => openEditModal(userData)}
                                className="hover:text-[#17A2B8] text-[#4ECFE0] font-bold cursor-pointer"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => handleDeleteUser(userData)}
                                className="hover:text-[#DC3545] text-[#FF6B6B] font-bold cursor-pointer"
                            >
                                Delete
                            </button>
                        </div>
                    )
                },
            },
        ],
        []
    )

    return (
        <div className="flex flex-col items-center p-4 md:p-8 w-full">
            <div className="flex justify-between items-center w-full">
                <Message text="Users" />

                <DefaultButton
                    className="bg-[#024C89] hover:bg-[#3572A1] text-[#F8F9FA] self-start mb-4"
                    onClick={() => {
                        setIsCsvModalOpen(true)
                    }}
                >
                    Upload CSV
                </DefaultButton>
            </div>

            {isLoading ? (
                <div className="py-8 text-gray-500 animate-pulse">
                    Loading Users...
                </div>
            ) : (
                <TableComponent data={data} columns={columns} />
            )}

            {isModalOpen && (
                <UserModal
                    key={selectedUser ? selectedUser.id : 'create-modal'}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    initialData={selectedUser}
                    onSave={handleSaveUser} // 3. Pass the function down to the modal!
                />
            )}

            {isCsvModalOpen && (
                <CsvUploadModal
                    isOpen={isCsvModalOpen}
                    onClose={() => setIsCsvModalOpen(false)}
                    onUploadSuccess={fetchUser}
                />
            )}
        </div>
    )
}

export default Users
