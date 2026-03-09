import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'data', 'trader-stats.json')
    const raw = readFileSync(filePath, 'utf-8')
    const stats = JSON.parse(raw)
    return NextResponse.json(stats, {
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    })
  } catch {
    return NextResponse.json({ error: 'no data' }, { status: 500 })
  }
}
