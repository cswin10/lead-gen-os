'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClientAndUser } from '@/app/actions/admin'
import { Building2 } from 'lucide-react'

interface AddClientFormProps {
  organizationId: string
}

export default function AddClientForm({ organizationId }: AddClientFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    clientId: string
    credentials: { email: string; password: string }
  } | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setResult(null)

    const formData = new FormData(e.currentTarget)

    const response = await createClientAndUser({
      companyName: formData.get('companyName') as string,
      industry: formData.get('industry') as string,
      costPerLead: Number(formData.get('costPerLead')),
      email: formData.get('email') as string,
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      password: formData.get('password') as string,
      organizationId,
    })

    setIsLoading(false)

    if (response.success && response.credentials && response.clientId) {
      setResult({
        clientId: response.clientId,
        credentials: response.credentials,
      })
      // Reset form
      ;(e.target as HTMLFormElement).reset()
    } else {
      alert(`Error: ${response.error}`)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Company Information</h3>

          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              name="companyName"
              placeholder="Acme Corp"
              required
              disabled={isLoading}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                name="industry"
                placeholder="Software, Real Estate, etc."
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="costPerLead">Cost Per Lead (£)</Label>
              <Input
                id="costPerLead"
                name="costPerLead"
                type="number"
                placeholder="50"
                required
                disabled={isLoading}
                min={0}
                step={1}
              />
            </div>
          </div>
        </div>

        {/* Portal Access */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-semibold">Client Portal Access</h3>
          <p className="text-sm text-muted-foreground">
            Create login credentials for this client to access their dashboard
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Contact First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="Jane"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Contact Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="Doe"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="jane@acmecorp.com"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="text"
              placeholder="Create a password for this client"
              required
              disabled={isLoading}
              minLength={8}
            />
            <p className="text-xs text-muted-foreground">
              Minimum 8 characters. You'll share this with the client.
            </p>
          </div>
        </div>

        <Button type="submit" disabled={isLoading} className="w-full" size="lg">
          <Building2 className="h-4 w-4 mr-2" />
          {isLoading ? 'Creating Client...' : 'Create Client & Portal Access'}
        </Button>
      </form>

      {result && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-3">
          <h4 className="font-semibold text-emerald-900">Client Created Successfully!</h4>
          <p className="text-sm text-emerald-800">
            Share these portal credentials with your client:
          </p>
          <div className="bg-white p-4 rounded border border-emerald-300 space-y-3">
            <div className="font-mono text-sm space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-muted-foreground">Portal URL:</div>
                <div className="font-semibold break-all">{window.location.origin}/dashboard/client</div>
                <div className="text-muted-foreground">Email:</div>
                <div className="font-semibold">{result.credentials.email}</div>
                <div className="text-muted-foreground">Password:</div>
                <div className="font-semibold">{result.credentials.password}</div>
              </div>
            </div>
          </div>
          <p className="text-xs text-emerald-700">
            ⚠️ Save these credentials now - you won't see them again! Next steps:
          </p>
          <ul className="text-xs text-emerald-700 list-disc list-inside space-y-1">
            <li>Create a campaign for this client</li>
            <li>Add leads to the campaign</li>
            <li>Assign leads to your agents</li>
            <li>Client can log in to view their dashboard</li>
          </ul>
        </div>
      )}
    </div>
  )
}
