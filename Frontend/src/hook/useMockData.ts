import { useEffect, useState } from 'react'

// 1. Add <T = any> here to make the hook flexible
function useMockData<T>() {
    // 2. Tell useState that it will hold an array of type T
    const [data, setData] = useState<T[]>([])
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/mockData.json')
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }
                const result = await response.json()
                setData(result)
            } catch (err) {
                console.error(err)
                setError('Failed to fetch data')
            }
        }

        fetchData()
    }, [])

    return { data, setData, error }
}

export default useMockData
