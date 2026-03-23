import { useEffect, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import DefaultButton from '../DefaultButton'
import TableComponent from '../Tables/TableComponent'
import type { Accounts } from '../../types/models'
import { apiService } from '../../services/userService'
import AdminUserModal from './AdminUsersModal'
import { formatDate } from '../../utils/formatters'

function AdminUsers() {
    const [data, setData] = useState<Accounts[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const [isModalOpen, setIsModalOpen] = useState(false)

    useEffect(() => {
        const fetchAccount = async () => {
            try {
                setIsLoading(true)
                const fetchedData = await apiService.getAll<Accounts>('users') // Change to acconts url
                setData(fetchedData)
            } catch (err) {
                console.error('Failed to load accounts:', err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchAccount()
    }, [])

    const handleSaveAccount = async (accountData: Accounts) => {
        try {
            const newAccount = await apiService.create<Accounts>(
                'users',
                accountData
            )

            setData((prevData: Accounts[]) => [newAccount, ...prevData])
        } catch (err) {
            console.error('Failed to save account:', err)
        }
    }

    const columns: ColumnDef<Accounts, any>[] = [
        { accessorKey: 'username', header: 'Username' },
        { accessorKey: 'first_name', header: 'First Name' },
        { accessorKey: 'last_name', header: 'Last Name' },
        {
            id: 'role',
            header: 'Role',
            accessorFn: (row) => {
                if (row.is_superuser && row.is_staff) return 'Admin'
                if (!row.is_superuser && row.is_staff) return 'HR'
                return 'Standard' // Fallback for regular users (is_staff=false)
            },
            meta: { filterVariant: 'select' },
        },
        {
            accessorKey: 'date_joined',
            header: 'Created',
            cell: (info) => formatDate(info.getValue() as string),
        },
    ]

    return (
        <div>
            <div className="flex flex-row justify-between items-center mb-2">
                <h2>Admin Users</h2>
                <DefaultButton
                    children="Add Admin"
                    onClick={() => setIsModalOpen(true)}
                    className="bg-[#024C89] hover:bg-[#3572A1] text-[#F8F9FA] self-center"
                />
            </div>

            {isLoading ? (
                <div className="py-8 text-gray-500 animate-pulse">
                    Loading Admin Users...
                </div>
            ) : (
                <TableComponent data={data} columns={columns} />
            )}

            {isModalOpen && (
                <AdminUserModal
                    key="create-modal"
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveAccount}
                />
            )}
        </div>
    )
}

export default AdminUsers
