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
    Column,
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
}

export default function TableComponent<TData>({
    data,
    columns,
    isPaginated = true,
}: TableComponentProps<TData>) {
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([])

    const table = useReactTable({
        data,
        columns,
        state: { columnFilters },
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
        <div className="text-[14px] w-full overflow-x-auto">
            <table className="w-full">
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
                                                        header.column.columnDef
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
                                                {header.column.getCanFilter() ? (
                                                    <div>
                                                        <Filter
                                                            column={
                                                                header.column
                                                            }
                                                        />
                                                    </div>
                                                ) : null}
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
                                            className="p-2 border-b"
                                        >
                                            <div
                                                className={getCellClasses(cell)}
                                            >
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </div>
                                        </td>
                                    )
                                })}
                            </tr>
                        )
                    })}
                </tbody>
            </table>

            {/* Pagination Controls */}
            {isPaginated && (
                <>
                    <div className="h-2" />
                    <div className="flex justify-center items-center gap-2 mt-4">
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
                </>
            )}
        </div>
    )
}

function Filter({ column }: { column: Column<any, unknown> }) {
    const { filterVariant } = column.columnDef.meta ?? {}
    const columnFilterValue = column.getFilterValue()

    const sortedUniqueValues = React.useMemo(
        () =>
            filterVariant === 'range'
                ? []
                : Array.from(column.getFacetedUniqueValues().keys())
                      .sort()
                      .slice(0, 5000),
        [column, filterVariant]
    )

    return filterVariant === 'range' ? (
        <div>
            <div className="flex space-x-2">
                <DebouncedInput
                    type="number"
                    min={Number(column.getFacetedMinMaxValues()?.[0] ?? '')}
                    max={Number(column.getFacetedMinMaxValues()?.[1] ?? '')}
                    value={(columnFilterValue as [number, number])?.[0] ?? ''}
                    onChange={(value) =>
                        column.setFilterValue((old: [number, number]) => [
                            value,
                            old?.[1],
                        ])
                    }
                    placeholder={`Min ${column.getFacetedMinMaxValues()?.[0] !== undefined ? `(${column.getFacetedMinMaxValues()?.[0]})` : ''}`}
                    className="w-full min-w-0 border shadow rounded text-[12px]"
                />
                <DebouncedInput
                    type="number"
                    min={Number(column.getFacetedMinMaxValues()?.[0] ?? '')}
                    max={Number(column.getFacetedMinMaxValues()?.[1] ?? '')}
                    value={(columnFilterValue as [number, number])?.[1] ?? ''}
                    onChange={(value) =>
                        column.setFilterValue((old: [number, number]) => [
                            old?.[0],
                            value,
                        ])
                    }
                    placeholder={`Max ${column.getFacetedMinMaxValues()?.[1] ? `(${column.getFacetedMinMaxValues()?.[1]})` : ''}`}
                    className="w-full min-w-0 border shadow rounded text-[12px]"
                />
            </div>
        </div>
    ) : filterVariant === 'select' ? (
        <select
            onChange={(e) => column.setFilterValue(e.target.value)}
            value={columnFilterValue?.toString()}
            className="w-full min-w-0 border shadow rounded text-[12px] p-0.5"
        >
            <option value="">All</option>
            {sortedUniqueValues.map((value, index) => (
                <option
                    value={value}
                    key={`${column.id}-${String(value)}-${index}`}
                >
                    {value}
                </option>
            ))}
        </select>
    ) : (
        <>
            <datalist id={column.id + 'list'}>
                {sortedUniqueValues.map((value: any, index: number) => (
                    <option
                        value={value}
                        key={`${column.id}-${String(value)}-${index}`}
                    />
                ))}
            </datalist>
            <DebouncedInput
                type="text"
                value={(columnFilterValue ?? '') as string}
                onChange={(value) => column.setFilterValue(value)}
                placeholder={`Search... (${column.getFacetedUniqueValues().size})`}
                className="w-full min-w-0 border shadow rounded p-0.5 text-[12px]"
                list={column.id + 'list'}
            />
        </>
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
