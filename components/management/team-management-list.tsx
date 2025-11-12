'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Users, Mail, Shield, UserX } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface TeamMember {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  created_at: string
}

export default function TeamManagementList({ teamMembers: initialMembers, organizationId }: any) {
  const [members, setMembers] = useState(initialMembers)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('agent')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', memberId)

      if (error) throw error

      setMembers(members.map((m: TeamMember) => 
        m.id === memberId ? { ...m, role: newRole } : m
      ))
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  const handleToggleActive = async (memberId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', memberId)

      if (error) throw error

      setMembers(members.map((m: TeamMember) => 
        m.id === memberId ? { ...m, is_active: !currentStatus } : m
      ))
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // In a real implementation, this would:
      // 1. Send an invitation email
      // 2. Create a temporary invite record
      // 3. When they sign up, link them to this org
      
      // For now, we'll just show a message
      alert(`Invitation feature coming soon!\n\nTo add team members now:\n1. Have them sign up at your app URL\n2. Update their profile in Supabase:\n   - Set organization_id to: ${organizationId}\n   - Set role to: ${inviteRole}`)
      
      setInviteEmail('')
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'destructive'
      case 'manager': return 'warning'
      case 'agent': return 'default'
      case 'client': return 'secondary'
      default: return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      {/* Invite Section */}
      <Card>
        <CardHeader>
          <CardTitle>Invite Team Member</CardTitle>
          <CardDescription>Send an invitation to join your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
                required
              />
            </div>
            <div className="w-48 space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={loading}>
                <Mail className="h-4 w-4 mr-2" />
                {loading ? 'Sending...' : 'Send Invite'}
              </Button>
            </div>
          </form>
          <p className="text-xs text-muted-foreground mt-2">
            Note: Email invitations are a work-in-progress feature. For now, manually add users in Supabase.
          </p>
        </CardContent>
      </Card>

      {/* Team Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>{members.length} members in your organization</CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No team members yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member: TeamMember) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{member.full_name || member.email}</p>
                      {!member.is_active && (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Joined {formatDateTime(member.created_at)}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Select
                      value={member.role}
                      onValueChange={(value) => handleUpdateRole(member.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">
                          <div className="flex items-center gap-2">
                            <Shield className="h-3 w-3" />
                            Owner
                          </div>
                        </SelectItem>
                        <SelectItem value="manager">
                          <div className="flex items-center gap-2">
                            <Shield className="h-3 w-3" />
                            Manager
                          </div>
                        </SelectItem>
                        <SelectItem value="agent">Agent</SelectItem>
                        <SelectItem value="client">Client</SelectItem>
                      </SelectContent>
                    </Select>

                    <Badge variant={getRoleColor(member.role) as any}>
                      {member.role}
                    </Badge>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(member.id, member.is_active)}
                    >
                      {member.is_active ? (
                        <><UserX className="h-3 w-3 mr-1" /> Deactivate</>
                      ) : (
                        <>Activate</>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
