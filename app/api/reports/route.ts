import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - List all reports for the organization
export async function GET(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const reportType = searchParams.get('type')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')

  let query = supabase
    .from('reports')
    .select('*, created_by_profile:profiles!created_by(full_name, email)', { count: 'exact' })
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (reportType) {
    query = query.eq('report_type', reportType)
  }

  const { data: reports, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    reports,
    total: count,
    limit,
    offset
  })
}
