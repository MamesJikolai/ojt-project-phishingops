import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts'
import type { AnalyticsResponse } from '../../../types/models'

interface BusinessUnitRiskChartProps {
    data: AnalyticsResponse
}

function BusinessUnitRiskChart({ data }: BusinessUnitRiskChartProps) {
    const businessUnitRiskData = data?.business_unit_stats
        .map((unit) => {
            const rate =
                unit.total > 0
                    ? Number(((unit.clicked / unit.total) * 100).toFixed(1))
                    : 0

            let barColor = '#28A745'
            if (rate > 20 && rate <= 50) barColor = '#FFC107'
            if (rate > 50) barColor = '#DC3545'

            return {
                business_unit: unit.business_unit,
                clickRate: rate,
                fill: barColor,
            }
        })
        .sort((a, b) => b.clickRate - a.clickRate)

    return (
        <div className="w-full bg-[#F8F9FA] p-6 rounded-lg drop-shadow-md border border-gray-100">
            <h3 className="mb-4">Business Unit Risk</h3>

            <div className="h-90 lg:h-120 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={businessUnitRiskData}
                        layout="vertical"
                        margin={{
                            top: 20,
                            right: 20,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            horizontal={true}
                            vertical={false}
                        />
                        <XAxis
                            type="number"
                            tickFormatter={(value) => `${value}%`}
                        />
                        <YAxis
                            dataKey="business_unit"
                            type="category"
                            width={100}
                            tick={{ fontSize: 14 }}
                            tickFormatter={(value) => `TMC ${value}`}
                        />
                        <Tooltip formatter={(value) => `${value}%`} />
                        <Bar
                            dataKey="clickRate"
                            name="Click Rate (%)"
                            radius={[0, 4, 4, 0]}
                            isAnimationActive
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

export default BusinessUnitRiskChart
