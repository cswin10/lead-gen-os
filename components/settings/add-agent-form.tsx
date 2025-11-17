'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createAgent } from '@/app/actions/admin'
import { UserPlus } from 'lucide-react'

interface AddAgentFormProps {
  organizationId: string
}

export default function AddAgentForm({ organizationId }: AddAgentFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setCredentials(null)

    const formData = new FormData(e.currentTarget)

    const result = await createAgent({
      email: formData.get('email') as string,
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      password: formData.get('password') as string,
      organizationId,
    })

    setIsLoading(false)

    if (result.success && result.credentials) {
      setCredentials(result.credentials)
      // Reset form
      ;(e.target as HTMLFormElement).reset()
    } else {
      alert(`Error: ${result.error}`)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              name="firstName"
              placeholder="John"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              name="lastName"
              placeholder="Smith"
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
            placeholder="john.smith@example.com"
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
            placeholder="Create a password for this agent"
            required
            disabled={isLoading}
            minLength={8}
          />
          <p className="text-xs text-muted-foreground">
            Minimum 8 characters. You'll share this with the agent.
          </p>
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          <UserPlus className="h-4 w-4 mr-2" />
          {isLoading ? 'Creating Agent...' : 'Create Agent Account'}
        </Button>
      </form>

      {credentials && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-2">
          <h4 className="font-semibold text-green-900">Agent Account Created!</h4>
          <p className="text-sm text-green-800">
            Share these credentials with your new agent:
          </p>
          <div className="bg-white p-3 rounded border border-green-300 font-mono text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-muted-foreground">Email:</div>
              <div className="font-semibold">{credentials.email}</div>
              <div className="text-muted-foreground">Password:</div>
              <div className="font-semibold">{credentials.password}</div>
            </div>
          </div>
          <p className="text-xs text-green-700">
            ⚠️ Save these credentials now - you won't see them again!
          </p>
        </div>
      )}
    </div>
  )
}
