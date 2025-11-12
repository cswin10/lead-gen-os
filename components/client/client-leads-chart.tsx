'use client'

import { memo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ChartData {
  date: string
  leads: number
  qualified: number
  won: number
}

interface ClientLeadsChartProps {
  data: ChartData[]
}

function ClientLeadsChart({ data }: ClientLeadsChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lead Delivery Timeline</CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <p className="text-muted-foreground">No data available yet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lead Delivery Timeline</CardTitle>
        <CardDescription>Your leads over the last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="leads" stroke="#3b82f6" name="Total Leads" strokeWidth={2} />
            <Line type="monotone" dataKey="qualified" stroke="#10b981" name="Qualified" strokeWidth={2} />
            <Line type="monotone" dataKey="won" stroke="#f59e0b" name="Closed Won" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export default memo(ClientLeadsChart)
