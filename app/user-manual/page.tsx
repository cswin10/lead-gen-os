import { FileText, Users, Phone, TrendingUp, Database, Settings } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function UserManual() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold tracking-tight gradient-text">Lead Gen OS User Manual</h1>
          <p className="text-xl text-muted-foreground">
            Complete guide to managing your lead generation business
          </p>
        </div>

        {/* Overview */}
        <Card className="border-0 shadow-premium">
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              System Overview
            </CardTitle>
            <CardDescription className="text-base">
              Lead Gen OS is a complete lead generation management platform designed for lead gen agencies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              The platform enables you to manage your entire lead generation operation from a single dashboard.
              It tracks calls, manages leads through the sales pipeline, assigns work to agents, and provides
              real-time reporting for both your team and your clients.
            </p>
            <div className="grid md:grid-cols-3 gap-4 pt-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <Users className="h-6 w-6 text-purple-600 mb-2" />
                <h4 className="font-semibold">Multi-Role System</h4>
                <p className="text-sm text-muted-foreground">Management, agents, and clients each have tailored dashboards</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <Phone className="h-6 w-6 text-blue-600 mb-2" />
                <h4 className="font-semibold">Call Tracking</h4>
                <p className="text-sm text-muted-foreground">Log every call with outcomes, notes, and duration</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <TrendingUp className="h-6 w-6 text-emerald-600 mb-2" />
                <h4 className="font-semibold">Real-time Analytics</h4>
                <p className="text-sm text-muted-foreground">Live KPIs and performance metrics</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Types */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold">User Types & Workflows</h2>

          {/* Management Dashboard */}
          <Card className="border-l-4 border-l-purple-600 shadow-premium">
            <CardHeader>
              <CardTitle className="text-2xl">1. Management / Owner Dashboard</CardTitle>
              <CardDescription className="text-base">High-level overview of the entire operation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-lg mb-2">Access:</h4>
                <p className="text-muted-foreground">Available to users with Owner or Manager role</p>
              </div>

              <div>
                <h4 className="font-semibold text-lg mb-2">Key Features:</h4>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li><strong>Calls Today:</strong> Total calls made across all agents</li>
                  <li><strong>Leads Delivered:</strong> New leads added to the system today</li>
                  <li><strong>Conversion Rate:</strong> Percentage of leads converted to customers this month</li>
                  <li><strong>Revenue Generated:</strong> Total value from closed won deals</li>
                  <li><strong>Qualified Leads:</strong> Number of qualified leads in the past 7 days</li>
                  <li><strong>Active Campaigns:</strong> Currently running campaigns with progress tracking</li>
                  <li><strong>Team Leaderboard:</strong> Agent performance rankings</li>
                  <li><strong>Campaign Performance Chart:</strong> Visual analytics of campaign effectiveness</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-lg mb-2">Daily Workflow:</h4>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Log in and review overnight activity</li>
                  <li>Check team performance on leaderboard</li>
                  <li>Monitor campaign progress toward targets</li>
                  <li>Review conversion rates and revenue</li>
                  <li>Identify underperforming campaigns or agents</li>
                  <li>Make strategic decisions based on real-time data</li>
                </ol>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Color Theme:</strong> Deep Navy & Purple gradient - represents authority and strategic oversight
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Agent Dashboard */}
          <Card className="border-l-4 border-l-cyan-600 shadow-premium">
            <CardHeader>
              <CardTitle className="text-2xl">2. Agent Dashboard</CardTitle>
              <CardDescription className="text-base">Focused workspace for sales agents making calls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-lg mb-2">Access:</h4>
                <p className="text-muted-foreground">Available to users with Agent role</p>
              </div>

              <div>
                <h4 className="font-semibold text-lg mb-2">Key Features:</h4>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li><strong>Calls Today:</strong> Personal call count for the day</li>
                  <li><strong>Call Time:</strong> Total minutes spent on calls</li>
                  <li><strong>Active Leads:</strong> Number of leads in your queue</li>
                  <li><strong>Qualified Today:</strong> Leads you've qualified today</li>
                  <li><strong>Leads Queue:</strong> Prioritized list of leads to contact</li>
                  <li><strong>Call Panel:</strong> Interface to start calls and log outcomes</li>
                  <li><strong>Quick Actions:</strong> Interested, Not Interested, Callback, Voicemail buttons</li>
                  <li><strong>Call Notes:</strong> Text area to document call details</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-lg mb-2">Daily Workflow:</h4>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Log in to see your assigned leads queue</li>
                  <li>Click on the first lead in the queue</li>
                  <li>Review lead details (name, company, phone, job title)</li>
                  <li>Click "Start Call" to begin the call timer</li>
                  <li>Make the call (Twilio integration will auto-dial when configured)</li>
                  <li>During/after call: Add notes about the conversation</li>
                  <li>Click a Quick Action button (Interested/Not Interested/Callback/Voicemail)</li>
                  <li>System automatically logs the call and updates lead status</li>
                  <li>Move to next lead in queue</li>
                  <li>Repeat until you've made 50+ calls (daily target)</li>
                </ol>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg">
                <p className="text-sm text-amber-900">
                  <strong>⚡ Pro Tip:</strong> Aim for 50+ calls per day for best results. Quick Actions automatically save call logs and update lead status.
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Color Theme:</strong> Blue & Cyan gradient - represents productivity and action
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Client Dashboard */}
          <Card className="border-l-4 border-l-emerald-600 shadow-premium">
            <CardHeader>
              <CardTitle className="text-2xl">3. Client Dashboard</CardTitle>
              <CardDescription className="text-base">Read-only view for clients to track their campaigns</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-lg mb-2">Access:</h4>
                <p className="text-muted-foreground">Available to users with Client role</p>
              </div>

              <div>
                <h4 className="font-semibold text-lg mb-2">Key Features:</h4>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li><strong>Leads This Week:</strong> Number of leads delivered in past 7 days</li>
                  <li><strong>Active Leads:</strong> Leads currently in the pipeline</li>
                  <li><strong>Conversion Rate:</strong> Percentage of leads that became customers</li>
                  <li><strong>Estimated Value:</strong> Total value from closed won leads</li>
                  <li><strong>Active Campaigns:</strong> Client's specific campaigns with lead counts</li>
                  <li><strong>Lead Delivery Timeline:</strong> 30-day chart showing leads, qualified, and won</li>
                  <li><strong>Recent Leads:</strong> Latest 10 leads with contact details</li>
                  <li><strong>Export Button:</strong> Download all leads as CSV file</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-lg mb-2">Client Workflow:</h4>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Log in to review leads delivered this week</li>
                  <li>Check conversion rate and estimated value</li>
                  <li>Review the lead delivery timeline chart</li>
                  <li>Browse recent leads in the list</li>
                  <li>Click "Export Leads" to download full lead list as CSV</li>
                  <li>Import leads into their CRM or contact them directly</li>
                </ol>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Color Theme:</strong> Emerald & Teal gradient - represents success and growth
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Onboarding Process */}
        <Card className="border-0 shadow-premium">
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Database className="h-8 w-8 text-primary" />
              Client Onboarding Process
            </CardTitle>
            <CardDescription className="text-base">
              Step-by-step guide to onboarding a new client
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">1</div>
                <div>
                  <h4 className="font-semibold">Create Client Record</h4>
                  <p className="text-sm text-muted-foreground">
                    Add client to database with company name, industry, cost per lead, and contact details
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">2</div>
                <div>
                  <h4 className="font-semibold">Create Campaign(s)</h4>
                  <p className="text-sm text-muted-foreground">
                    Set up campaign(s) with target lead count, description, and timeline
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">3</div>
                <div>
                  <h4 className="font-semibold">Import Initial Leads</h4>
                  <p className="text-sm text-muted-foreground">
                    Upload lead list (CSV) with contact details, assign to campaign and client
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">4</div>
                <div>
                  <h4 className="font-semibold">Assign Leads to Agents</h4>
                  <p className="text-sm text-muted-foreground">
                    Distribute leads among available agents based on capacity and territory
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">5</div>
                <div>
                  <h4 className="font-semibold">Create Client Portal Access</h4>
                  <p className="text-sm text-muted-foreground">
                    Set up user account for client with "Client" role and send login credentials
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">6</div>
                <div>
                  <h4 className="font-semibold">Client Walkthrough</h4>
                  <p className="text-sm text-muted-foreground">
                    Schedule onboarding call to show client their dashboard, explain KPIs, and demonstrate export feature
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">7</div>
                <div>
                  <h4 className="font-semibold">Begin Calling</h4>
                  <p className="text-sm text-muted-foreground">
                    Agents start working through lead queue, client sees real-time updates
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Flow */}
        <Card className="border-0 shadow-premium">
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-primary" />
              How Data Flows Through the System
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg space-y-3">
                <h4 className="font-semibold text-lg">1. Lead Creation</h4>
                <p className="text-sm text-muted-foreground">
                  Leads are created in the database with status "new", assigned to a client, campaign, and agent
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-lg space-y-3">
                <h4 className="font-semibold text-lg">2. Agent Queue</h4>
                <p className="text-sm text-muted-foreground">
                  Lead appears in assigned agent's queue, sorted by priority and creation date
                </p>
              </div>

              <div className="bg-gradient-to-r from-cyan-50 to-sky-50 p-6 rounded-lg space-y-3">
                <h4 className="font-semibold text-lg">3. Call Logging</h4>
                <p className="text-sm text-muted-foreground">
                  Agent starts call → timer runs → agent clicks Quick Action → call record created with duration, outcome, and notes
                </p>
              </div>

              <div className="bg-gradient-to-r from-sky-50 to-emerald-50 p-6 rounded-lg space-y-3">
                <h4 className="font-semibold text-lg">4. Status Update</h4>
                <p className="text-sm text-muted-foreground">
                  Lead status automatically updates (interested, not_interested, callback, qualified, etc.) and last_contacted_at timestamp is set
                </p>
              </div>

              <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-lg space-y-3">
                <h4 className="font-semibold text-lg">5. Real-time Dashboard Updates</h4>
                <p className="text-sm text-muted-foreground">
                  All dashboards refresh (30s cache) → Management sees updated KPIs → Client sees new leads delivered → Agent sees queue updated
                </p>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-teal-50 p-6 rounded-lg space-y-3">
                <h4 className="font-semibold text-lg">6. Conversion Tracking</h4>
                <p className="text-sm text-muted-foreground">
                  When lead status becomes "closed_won", it contributes to conversion rate and revenue calculations
                </p>
              </div>

              <div className="bg-gradient-to-r from-teal-50 to-purple-50 p-6 rounded-lg space-y-3">
                <h4 className="font-semibold text-lg">7. Client Export</h4>
                <p className="text-sm text-muted-foreground">
                  Client clicks Export → API generates CSV with all their leads → File downloads with contact details and status
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Details */}
        <Card className="border-0 shadow-premium">
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Settings className="h-8 w-8 text-primary" />
              Technical Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">Database Tables:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>organizations:</strong> Your lead gen agency</li>
                <li><strong>profiles:</strong> User accounts (owner, manager, agent, client roles)</li>
                <li><strong>clients:</strong> Client companies you're generating leads for</li>
                <li><strong>campaigns:</strong> Lead gen campaigns tied to clients</li>
                <li><strong>leads:</strong> Individual lead records with contact info and status</li>
                <li><strong>calls:</strong> Call logs with duration, outcome, and notes</li>
                <li><strong>campaign_performance:</strong> Aggregated campaign metrics</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-2">Lead Statuses:</h4>
              <div className="grid md:grid-cols-2 gap-2 text-sm">
                <div className="p-2 bg-slate-50 rounded"><strong>new:</strong> Not yet contacted</div>
                <div className="p-2 bg-slate-50 rounded"><strong>contacted:</strong> Initial contact made</div>
                <div className="p-2 bg-slate-50 rounded"><strong>qualified:</strong> Meets qualification criteria</div>
                <div className="p-2 bg-slate-50 rounded"><strong>interested:</strong> Expressed interest</div>
                <div className="p-2 bg-slate-50 rounded"><strong>not_interested:</strong> Not interested</div>
                <div className="p-2 bg-slate-50 rounded"><strong>callback:</strong> Requested callback</div>
                <div className="p-2 bg-slate-50 rounded"><strong>closed_won:</strong> Converted to customer</div>
                <div className="p-2 bg-slate-50 rounded"><strong>closed_lost:</strong> Lost opportunity</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-2">Integrations:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>Twilio (Planned):</strong> Auto-dialing and call recording</li>
                <li><strong>Resend/SendGrid (Planned):</strong> Email notifications to clients</li>
                <li><strong>CSV Export:</strong> Built-in lead export functionality</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-2">Performance Optimizations:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>30-second page caching for fast dashboard loads</li>
                <li>Parallel database queries (Promise.all)</li>
                <li>Server-side chart data aggregation</li>
                <li>React.memo() on all chart components</li>
                <li>Premium animations with GPU acceleration</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center pt-8 pb-4">
          <p className="text-sm text-muted-foreground">
            Lead Gen OS - Built for modern lead generation agencies
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            For technical support or feature requests, contact your system administrator
          </p>
        </div>
      </div>
    </div>
  )
}
