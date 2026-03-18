import {
    useReactTable,
    getCoreRowModel,
    flexRender,
} from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'

interface BasicTableProps<TData> {
    data: TData[]
    columns: ColumnDef<any, any>[]
}

function BasicTable<TData>({ data, columns }: BasicTableProps<TData>) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    return (
        <div className="text-[14px] w-full overflow-x-auto">
            <table>
                <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <th key={header.id} colSpan={header.colSpan}>
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                              header.column.columnDef.header,
                                              header.getContext()
                                          )}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody>
                    {table.getRowModel().rows.map((row) => (
                        <tr key={row.id}>
                            {row.getVisibleCells().map((cell) => {
                                let cellClasses =
                                    'p-2 border-b border-[#DDE2E5] '

                                if (cell.column.id.toLowerCase() === 'role') {
                                    const cellValue = String(
                                        cell.getValue()
                                    ).toLowerCase()

                                    if (cellValue === 'admin') {
                                        cellClasses +=
                                            'text-[#00A3AD] font-bold'
                                    } else if (cellValue === 'hr') {
                                        cellClasses +=
                                            'text-[#C5A059] font-bold'
                                    }
                                }

                                return (
                                    <td key={cell.id} className={cellClasses}>
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}
                                    </td>
                                )
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default BasicTable
