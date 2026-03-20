import { useState, useEffect, useMemo, useCallback } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import Message from '../../components/Message.tsx'
import TableComponent from '../../components/Tables/TableComponent.tsx'
import type { User } from '../../types/models.ts'
import { apiService } from '../../services/userService.ts'
import UserModal from '../../components/Users/UserModal.tsx'
import DefaultButton from '../../components/DefaultButton.tsx'

function Users() {
    const [data, setData] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
    const [selectedUser, setSelectedCUser] = useState<User | null>(null)

    useEffect(() => {
        const fetchUser = async () => {
            try {
                setIsLoading(true)
                const fetchedData = await apiService.getAll<User>('userData')
                setData(fetchedData)
            } catch (err) {
                console.error('Failed to load user:', err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchUser()
    }, [])

    const openCreateModal = useCallback(() => {
        setModalMode('create')
        setSelectedCUser(null)
        setIsModalOpen(true)
    }, [])

    const openEditModal = useCallback((userData: User) => {
        setModalMode('edit')
        setSelectedCUser(userData)
        setIsModalOpen(true)
    }, [])

    const handleDeleteUser = async (userData: User) => {
        const confirmDelete = window.confirm(
            `Are you sure you want to delete "${userData.name}"?`
        )
        if (confirmDelete) {
            try {
                await apiService.delete('userData', userData.id)

                setData((prev: User[]) =>
                    prev.filter((item) => item.id !== userData.id)
                )
            } catch (err) {
                console.error('Failed to delete user:', err)
            }
        }
    }

    const handleSaveUser = async (userData: User) => {
        try {
            if (modalMode === 'edit') {
                const updatedUser = await apiService.update<User>(
                    'userData',
                    userData.id,
                    userData
                )

                setData((prev: User[]) =>
                    prev.map((item) =>
                        item.id === updatedUser.id ? updatedUser : item
                    )
                )
            } else if (modalMode === 'create') {
                const newUser = await apiService.create<User>('users', userData)

                setData((prev: User[]) => [newUser, ...prev])
            }
        } catch (err) {
            console.error('Failed to save user:', err)
        }
    }

    const columns = useMemo<ColumnDef<User, any>[]>(
        () => [
            { accessorKey: 'name', header: 'Name' },
            { accessorKey: 'email', header: 'Email' },
            {
                accessorKey: 'department',
                header: 'Department',
                meta: { filterVariant: 'select' },
            },
            {
                accessorKey: 'campaign',
                header: 'Campaign',
                meta: { filterVariant: 'select' },
            },
            {
                accessorKey: 'status',
                header: 'Status',
                meta: { filterVariant: 'select' },
            },
            {
                accessorKey: 'clicked',
                header: 'Clicked?',
                meta: { filterVariant: 'select' },
            },
            {
                accessorKey: 'training',
                header: 'Training',
                meta: { filterVariant: 'select' },
            },
            {
                accessorKey: 'score',
                header: 'Score',
                enableColumnFilter: false,
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
        <div className="flex flex-col items-center m-8">
            <Message text="Users" />

            <DefaultButton
                className="bg-[#024C89] hover:bg-[#3572A1] text-[#F8F9FA] self-start mb-4"
                onClick={openCreateModal}
                children="Add User"
            />

            <TableComponent data={data} columns={columns} />

            {isModalOpen && (
                <UserModal
                    key={selectedUser ? selectedUser.id : 'create-modal'}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    mode={modalMode}
                    initialData={selectedUser}
                    onSave={handleSaveUser} // 3. Pass the function down to the modal!
                />
            )}
        </div>
    )
}

export default Users
