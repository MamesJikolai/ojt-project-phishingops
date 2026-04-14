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

    const handleSaveAccount = async (
        accountData: Omit<
            Accounts,
            'id' | 'is_staff' | 'is_superuser' | 'date_joined'
        >
    ) => {
        try {
            const newAccount = await apiService.create<Accounts>(
                'users',
                accountData
            )
            setData((prevData: Accounts[]) => [newAccount, ...prevData])
        } catch (err: any) {
            console.error('Django Validation Error:', err.response?.data)

            alert(
                'Failed to save user. Check the console for the exact reason!'
            )
        }
    }

    const columns: ColumnDef<Accounts, any>[] = [
        { accessorKey: 'username', header: 'Username' },
        { accessorKey: 'first_name', header: 'First Name' },
        { accessorKey: 'last_name', header: 'Last Name' },
        {
            accessorKey: 'role',
            header: 'Role',
            cell: (info) => {
                const role = info.getValue() as string
                return role ? role.charAt(0).toUpperCase() + role.slice(1) : '-'
            },
            meta: { filterVariant: 'select' },
        },
        {
            id: 'date_joined',
            header: 'Created',
            enableColumnFilter: false,
            accessorFn: (row) =>
                row.date_joined ? formatDate(row.date_joined) : '-',
            sortingFn: (rowA, rowB) => {
                const a = new Date(rowA.original.date_joined || 0).getTime()
                const b = new Date(rowB.original.date_joined || 0).getTime()
                return a - b
            },
        },
    ]

    return (
        <div className="w-full">
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
                <TableComponent data={data} columns={columns} pageSize={5} />
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
