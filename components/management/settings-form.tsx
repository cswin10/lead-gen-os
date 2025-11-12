'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Building2, User } from 'lucide-react'

export default function SettingsForm({ profile, organization }: any) {
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState({
    full_name: profile.full_name || '',
    phone: profile.phone || '',
  })
  const [orgData, setOrgData] = useState({
    name: organization?.name || '',
  })

  const supabase = createClient()

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.full_name,
          phone: profileData.phone,
        })
        .eq('id', profile.id)

      if (error) throw error

      alert('Profile updated successfully!')
      window.location.reload()
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: orgData.name,
        })
        .eq('id', organization.id)

      if (error) throw error

      alert('Organization updated successfully!')
      window.location.reload()
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* User Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Profile
          </CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={profile.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <div className="flex items-center h-10">
                  <Badge variant="secondary" className="capitalize">
                    {profile.role}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                  placeholder="John Smith"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder="+44 20 7123 4567"
                />
              </div>
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Update Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Organization Settings */}
      {['owner', 'manager'].includes(profile.role) && organization && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organization Settings
            </CardTitle>
            <CardDescription>Manage your organization details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateOrganization} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="org_name">Organization Name</Label>
                  <Input
                    id="org_name"
                    value={orgData.name}
                    onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                    placeholder="My Agency"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subscription</Label>
                  <div className="flex items-center h-10">
                    <Badge variant="default" className="capitalize">
                      {organization.subscription_tier}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Organization ID</Label>
                <Input
                  value={organization.id}
                  disabled
                  className="bg-muted font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">Use this ID for API integrations</p>
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Update Organization'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Account Status:</span>
            <Badge variant={profile.is_active ? 'success' : 'destructive'}>
              {profile.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          {organization && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subscription Status:</span>
                <Badge variant={organization.subscription_status === 'active' ? 'success' : 'warning'}>
                  {organization.subscription_status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subscription Tier:</span>
                <span className="font-medium capitalize">{organization.subscription_tier}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
