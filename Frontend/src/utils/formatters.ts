/**
 * Formats an ISO date string into a readable format (e.g., "Mar 23, 2026, 2:29 PM").
 * Returns a dash ('-') if the date is null or undefined.
 */
export const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '-'

    return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(dateString))
}
