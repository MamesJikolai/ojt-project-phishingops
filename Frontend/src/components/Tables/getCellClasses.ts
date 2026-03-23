export default function getCellClasses(cell: any) {
    const cellValue = String(cell.getValue()).toLowerCase()
    const columnId = cell.column.id.toLowerCase()

    const baseBadge =
        'px-2 py-1 rounded-md w-fit whitespace-nowrap text-xs leading-none font-semibold'

    if (columnId === 'role') {
        if (cellValue === 'admin')
            return `${baseBadge} bg-purple-100 text-purple-800`
        if (cellValue === 'hr') return `${baseBadge} bg-blue-100 text-blue-800`
    } else if (columnId === 'status') {
        if (cellValue === 'completed')
            return `${baseBadge} bg-green-100 text-green-800`
        if (cellValue === 'cancelled')
            return `${baseBadge} bg-red-100 text-red-800`
        if (cellValue === 'active')
            return `${baseBadge} bg-cyan-100 text-cyan-800`
        if (cellValue === 'draft')
            return `${baseBadge} bg-purple-100 text-purple-800`
        if (cellValue === 'scheduled')
            return `${baseBadge} bg-yellow-100 text-yellow-800`
    } else if (columnId === 'emailstatus') {
        if (cellValue === 'sent')
            return `${baseBadge} bg-green-100 text-green-800`
        if (cellValue === 'failed')
            return `${baseBadge} bg-red-100 text-red-800`
    } else if (columnId === 'score') {
        if (Number(cellValue) < 60)
            return `${baseBadge} bg-red-100 text-red-800`
        if (Number(cellValue) >= 60 && Number(cellValue) < 70)
            return `${baseBadge} bg-orange-100 text-orange-800`
        if (Number(cellValue) >= 70 && Number(cellValue) < 80)
            return `${baseBadge} bg-yellow-100 text-yellow-800`
        if (Number(cellValue) >= 80)
            return `${baseBadge} bg-green-100 text-green-800
        `
    }

    return ''
}
