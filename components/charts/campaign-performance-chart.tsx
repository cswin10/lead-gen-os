'use client'

import { memo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface CampaignData {
  campaign_name: string
  total_leads: number
  contacted_leads: number
  qualified_leads: number
  won_leads: number
}

interface CampaignPerformanceChartProps {
  data: CampaignData[]
}

function CampaignPerformanceChart({ data }: CampaignPerformanceChartProps) {

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
          <CardDescription>Lead progression by campaign</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <p className="text-muted-foreground">No campaign data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaign Performance</CardTitle>
        <CardDescription>Lead progression through the funnel</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="campaign_name" 
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="total_leads" fill="#3b82f6" name="Total Leads" />
            <Bar dataKey="contacted_leads" fill="#8b5cf6" name="Contacted" />
            <Bar dataKey="qualified_leads" fill="#10b981" name="Qualified" />
            <Bar dataKey="won_leads" fill="#f59e0b" name="Won" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export default memo(CampaignPerformanceChart)
