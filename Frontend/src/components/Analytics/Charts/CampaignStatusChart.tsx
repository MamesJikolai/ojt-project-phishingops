import { Pie, PieChart, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { AnalyticsResponse } from '../../../types/models'

interface CampaignStatusChartProps {
    data: AnalyticsResponse
}

function CampaignStatusChart({ data }: CampaignStatusChartProps) {
    const statusCounts = data?.campaigns.reduce((acc, campaign) => {
        acc[campaign.status] = (acc[campaign.status] || 0) + 1
        return acc
    }, {})

    const STATUS_COLORS: Record<string, string> = {
        Completed: '#28A745',
        Draft: '#3572A1',
        Paused: '#FFC107',
        Running: '#00A3AD',
    }

    const statusData = Object.keys(statusCounts).map((status) => {
        const name = status.charAt(0).toUpperCase() + status.slice(1)
        return {
            name: name,
            value: statusCounts[status],
            fill: STATUS_COLORS[name] || '#024C89',
        }
    })

    return (
        <div className="w-full bg-[#F8F9FA] p-6 rounded-lg drop-shadow-md border border-gray-100">
            <h3 className="mb-4">Campaign Status Distribution</h3>

            <div className="h-90 lg:h-120 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={statusData}
                            dataKey="value"
                            cx="50%"
                            cy="50%"
                            innerRadius="50%"
                            outerRadius="80%"
                            isAnimationActive
                        />
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

export default CampaignStatusChart
