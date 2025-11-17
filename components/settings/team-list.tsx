'use client'

import { Badge } from '@/components/ui/badge'
import { User, Mail } from 'lucide-react'

interface TeamMember {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  created_at: string
}

interface TeamListProps {
  members: TeamMember[]
  type: 'agent' | 'client'
}

export default function TeamList({ members, type }: TeamListProps) {
  if (members.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No {type}s yet. Add your first {type} above.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-slate-50 to-white hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-base">
                {member.first_name} {member.last_name}
              </p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Mail className="h-3 w-3" />
                {member.email}
              </div>
            </div>
          </div>
          <div className="text-right">
            <Badge variant="outline" className="mb-1">
              {member.role}
            </Badge>
            <p className="text-xs text-muted-foreground">
              Joined {new Date(member.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
