import React from 'react'
import {
    flexRender,
    getCoreRowModel,
    getFacetedMinMaxValues,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table'
import type {
    ColumnDef,
    ColumnFiltersState,
    RowData,
} from '@tanstack/react-table'
import DefaultButton from '../DefaultButton'
import getCellClasses from './getCellClasses'

declare module '@tanstack/react-table' {
    interface ColumnMeta<TData extends RowData, TValue> {
        filterVariant?: 'text' | 'range' | 'select'
    }
}

interface TableComponentProps<TData> {
    data: TData[]
    columns: ColumnDef<TData, any>[]
    isPaginated?: true | false
    customTablePadding?: string
    title?: string
    pageSize?: number
}

export default function TableComponent<TData>({
    data,
    columns,
    isPaginated = true,
    customTablePadding = '',
    title,
    pageSize = 10,
}: TableComponentProps<TData>) {
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([])

    const [globalFilter, setGlobalFilter] = React.useState('')

    const table = useReactTable({
        data,
        columns,
        state: { columnFilters, globalFilter },
        onGlobalFilterChange: setGlobalFilter,
        initialState: {
            pagination: {
                pageSize: pageSize,
            },
        },
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getFacetedMinMaxValues: getFacetedMinMaxValues(),
        debugTable: true,
    })

    return (
        <div className={`text-[14px] ${isPaginated ? 'w-full' : 'flex-1'}`}>
            <h2>{title}</h2>

            {isPaginated && (
                <DebouncedInput
                    value={globalFilter ?? ''}
                    onChange={(value) => setGlobalFilter(String(value))}
                    className="px-2 py-1 mb-2 border border-[#4A4A4A] rounded-4xl w-full max-w-[40%] outline-none focus:border-[#024C89]"
                    placeholder="Search all columns..."
                />
            )}

            <div className="w-full overflow-x-auto">
                <table className="w-full min-w-max table-auto">
                    <thead>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <th
                                            key={header.id}
                                            colSpan={header.colSpan}
                                        >
                                            {header.isPlaceholder ? null : (
                                                <>
                                                    <div
                                                        {...{
                                                            className:
                                                                header.column.getCanSort()
                                                                    ? 'cursor-pointer select-none'
                                                                    : '',
                                                            onClick:
                                                                header.column.getToggleSortingHandler(),
                                                        }}
                                                    >
                                                        {flexRender(
                                                            header.column
                                                                .columnDef
                                                                .header,
                                                            header.getContext()
                                                        )}
                                                        {{
                                                            asc: ' ↑',
                                                            desc: ' ↓',
                                                        }[
                                                            header.column.getIsSorted() as string
                                                        ] ?? null}
                                                    </div>
                                                </>
                                            )}
                                        </th>
                                    )
                                })}
                            </tr>
                        ))}
                    </thead>

                    <tbody>
                        {table.getRowModel().rows.map((row) => {
                            return (
                                <tr key={row.id}>
                                    {row.getVisibleCells().map((cell) => {
                                        return (
                                            <td
                                                key={cell.id}
                                                className={`${customTablePadding}`}
                                            >
                                                <div
                                                    className={getCellClasses(
                                                        cell
                                                    )}
                                                >
                                                    {flexRender(
                                                        cell.column.columnDef
                                                            .cell,
                                                        cell.getContext()
                                                    )}
                                                </div>
                                            </td>
                                        )
                                    })}
                                </tr>
                            )
                        })}

                        {/* Render blank rows to fill rows except when not paginated */}
                        {table.getState().pagination.pageSize -
                            table.getRowModel().rows.length >
                            0 &&
                            isPaginated &&
                            Array.from({
                                length:
                                    table.getState().pagination.pageSize -
                                    table.getRowModel().rows.length,
                            }).map((_, rowIndex) => (
                                <tr key={`empty-${rowIndex}`}>
                                    {table
                                        .getVisibleLeafColumns()
                                        .map((column) => (
                                            <td
                                                key={`empty-${rowIndex}-${column.id}`}
                                                className={`${customTablePadding}`}
                                            >
                                                <div className="opacity-0 pointer-events-none select-none">
                                                    &nbsp;
                                                </div>
                                            </td>
                                        ))}
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {isPaginated && (
                <div className="flex justify-center items-center gap-2 mt-6">
                    <DefaultButton
                        isPage={true}
                        children="<<"
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                        className="hover:bg-[#024C89] hover:text-[#FFFAFA]"
                    />
                    <DefaultButton
                        isPage={true}
                        children="<"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="hover:bg-[#024C89] hover:text-[#FFFAFA]"
                    />
                    <DefaultButton
                        isPage={true}
                        children=">"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="hover:bg-[#024C89] hover:text-[#FFFAFA]"
                    />
                    <DefaultButton
                        isPage={true}
                        children=">>"
                        onClick={() =>
                            table.setPageIndex(table.getPageCount() - 1)
                        }
                        disabled={!table.getCanNextPage()}
                        className="hover:bg-[#024C89] hover:text-[#FFFAFA]"
                    />
                    <span className="flex items-center gap-1">
                        <div>Page</div>
                        <strong>
                            {table.getState().pagination.pageIndex + 1} of{' '}
                            {table.getPageCount()}
                        </strong>
                    </span>
                </div>
            )}
        </div>
    )
}

function DebouncedInput({
    value: initialValue,
    onChange,
    debounce = 500,
    ...props
}: {
    value: string | number
    onChange: (value: string | number) => void
    debounce?: number
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>) {
    const [value, setValue] = React.useState(initialValue)

    React.useEffect(() => {
        setValue(initialValue)
    }, [initialValue])

    React.useEffect(() => {
        const timeout = setTimeout(() => {
            onChange(value)
        }, debounce)

        return () => clearTimeout(timeout)
    }, [value])

    return (
        <input
            {...props}
            value={value}
            onChange={(e) => setValue(e.target.value)}
        />
    )
}
