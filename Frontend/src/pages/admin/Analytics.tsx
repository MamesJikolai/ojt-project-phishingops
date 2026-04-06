import { useEffect, useState } from 'react'
import AnalyticsCards from '../../components/Analytics/AnalyticsCards.tsx'
import Message from '../../components/Message.tsx'
import type { AnalyticsResponse } from '../../types/models.ts'
import { apiService } from '../../services/userService.ts'
import CampaignStatusChart from '../../components/Analytics/Charts/CampaignStatusChart.tsx'
import SimulationStatsChart from '../../components/Analytics/Charts/SimulationStatsChart.tsx'
import LatestCampaignsClickRateChart from '../../components/Analytics/Charts/LatestCampaignsClickRateChart.tsx'
import TopDepartmentsEngagementChart from '../../components/Analytics/Charts/TopDepartmentsEngagementChart.tsx'
import TopDepartmentsRiskChart from '../../components/Analytics/Charts/TopDepartmentsRiskChart.tsx'

function Analytics() {
    const [data, setData] = useState<AnalyticsResponse | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setIsLoading(true)
                const fetchedData =
                    await apiService.getSingleton<AnalyticsResponse>(
                        'analytics'
                    )
                setData(fetchedData)
                console.log(fetchedData)
            } catch (err) {
                console.error('Failed to load analytics', err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchAnalytics()
    }, [])

    if (isLoading) return <div className="p-8">Loading analytics data...</div>

    const summaryMetrics = data
        ? [
              { label: 'Total Campaigns', value: data.summary.total_campaigns },
              { label: 'Total Sent', value: data.summary.total_sent },
              { label: 'Total Clicked', value: data.summary.total_clicked },
              { label: 'Total Completed', value: data.summary.total_completed },
              { label: 'Click Rate', value: data.summary.click_rate },
              { label: 'Completion Rate', value: data.summary.completion_rate },
          ]
        : []

    return (
        <div className="flex flex-col items-start p-4 md:p-8 w-full">
            <Message text="Analytics & Reports" />

            {data && (
                <div className="flex flex-col gap-4 lg:gap-8 w-full">
                    {/* Summary Metrics */}
                    <div className="flex flex-row flex-wrap gap-4 justify-center md:justify-start">
                        {summaryMetrics.map((metric, index) => (
                            <AnalyticsCards
                                key={index}
                                text={metric.label}
                                item={metric.value}
                            />
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 w-full">
                        {/* Campaign Status Distribution */}
                        <CampaignStatusChart data={data} />

                        {/* Simulation Stats Chart */}
                        <SimulationStatsChart data={data} />

                        {/* Campaign Click Rate Chart */}
                        <LatestCampaignsClickRateChart data={data} />

                        {/* Department Stats Chart */}
                        <TopDepartmentsEngagementChart data={data} />

                        {/* Department Risk Data */}
                        <TopDepartmentsRiskChart data={data} />
                    </div>
                </div>
            )}
        </div>
    )
}

export default Analytics
