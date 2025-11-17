'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { useState } from 'react'

interface ExportLeadsButtonProps {
  clientId: string
}

export default function ExportLeadsButton({ clientId }: ExportLeadsButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)

    try {
      const response = await fetch(`/api/export-leads?clientId=${clientId}`)

      if (!response.ok) {
        throw new Error('Export failed')
      }

      // Create a blob from the response
      const blob = await response.blob()

      // Create a download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export leads. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      className="dashboard-primary hover:opacity-90 transition-opacity shadow-lg text-white"
      onClick={handleExport}
      disabled={isExporting}
    >
      <Download className="h-4 w-4 mr-2" />
      {isExporting ? 'Exporting...' : 'Export Leads'}
    </Button>
  )
}
