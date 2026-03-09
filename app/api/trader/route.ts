import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const url = 'https://raw.githubusercontent.com/sashorizlob/corp-dashboard/main/data/trader-stats.json'
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) throw new Error(`GitHub: ${res.status}`)
    const stats = await res.json()
    return NextResponse.json(stats, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
