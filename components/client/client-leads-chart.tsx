'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format, subDays } from 'date-fns'

interface ChartData {
  date: string
  leads: number
  qualified: number
  won: number
}

export default function ClientLeadsChart({ clientId }: { clientId: string }) {
  const [data, setData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      
      // Get last 30 days of data
      const thirtyDaysAgo = subDays(new Date(), 30)
      
      const { data: leads } = await supabase
        .from('leads')
        .select('created_at, status')
        .eq('client_id', clientId)
        .gte('created_at', thirtyDaysAgo.toISOString())
      
      if (leads) {
        // Group by date
        const groupedData: Record<string, { leads: number, qualified: number, won: number }> = {}
        
        leads.forEach((lead) => {
          const date = format(new Date(lead.created_at), 'MMM dd')
          if (!groupedData[date]) {
            groupedData[date] = { leads: 0, qualified: 0, won: 0 }
          }
          groupedData[date].leads++
          if (lead.status === 'qualified') groupedData[date].qualified++
          if (lead.status === 'closed_won') groupedData[date].won++
        })
        
        // Convert to array
        const chartData = Object.entries(groupedData).map(([date, counts]) => ({
          date,
          ...counts
        }))
        
        setData(chartData)
      }
      
      setLoading(false)
    }
    
    fetchData()
  }, [clientId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lead Delivery Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

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
