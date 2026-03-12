'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import agents from '../data/agents.json'

type Agent = typeof agents[0]

type TraderStats = {
  balance: number
  total_pnl: number
  pnl: number
  bets_total: number
  bets_won: number
  bets_lost: number
  bets_pending: number
  win_rate: number
  strategy: string
  snipes_today?: number
  last_bet?: { time: string; side: string; amount: number; status: string }
  last_win?: { time: string; side: string; amount: number }
  updated_at: string
  recent?: any[]
}

type AllStats = {
  [key: string]: TraderStats
}

const TRADER_IDS = ['oleg', 'anna', 'vova']

const departments = [
  { id: 'headquarters', label: '★ ШТАБ', color: '#00ff88', cols: 1 },
  { id: 'reception', label: '◆ РЕСЕПШН', color: '#00aaff', cols: 1 },
  { id: 'work', label: '▲ РАБОЧИЙ ОТДЕЛ', color: '#ffaa00', cols: 1 },
  { id: 'personal', label: '● ЛИЧНЫЙ ОТДЕЛ', color: '#aa00ff', cols: 1 },
  { id: 'analytics', label: '■ АНАЛИТИКА', color: '#ff00aa', cols: 1 },
]

const statusConfig = {
  active: { label: 'АКТИВЕН', color: '#00ff88', dot: '#00ff88' },
  busy: { label: 'ЗАНЯТ', color: '#ffaa00', dot: '#ffaa00' },
  offline: { label: 'ОФЛАЙН', color: '#444', dot: '#333' },
}

function PixelChar({ emoji, status }: { emoji: string; status: string }) {
  return (
    <div className={`text-center mb-2 ${status === 'active' ? 'float' : ''}`}>
      <div style={{ fontSize: 28, lineHeight: 1, filter: status === 'offline' ? 'grayscale(1) opacity(0.4)' : 'none' }}>
        {emoji}
      </div>
      {status === 'active' && (
        <div style={{ color: '#00ff88', fontSize: 6, marginTop: 2 }} className="blink">▼</div>
      )}
    </div>
  )
}

function TraderMiniStats({ stats }: { stats: TraderStats | null }) {
  if (!stats) return null
  const pnl = stats.total_pnl ?? stats.pnl ?? 0
  const pnlColor = pnl >= 0 ? '#00ff88' : '#ff4444'
  const wr = stats.win_rate ?? 0
  const won = stats.bets_won ?? 0
  const lost = stats.bets_lost ?? 0
  return (
    <div style={{ marginTop: 8, borderTop: '1px solid #1a1a1a', paddingTop: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 5, color: '#555' }}>BAL</span>
        <span style={{ fontSize: 5, color: '#fff' }}>${(stats.balance ?? 0).toFixed(2)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 5, color: '#555' }}>PnL</span>
        <span style={{ fontSize: 5, color: pnlColor }}>{pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 5, color: '#555' }}>W/L</span>
        <span style={{ fontSize: 5, color: '#fff' }}>{won}W/{lost}L</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 5, color: '#555' }}>WR</span>
        <span style={{ fontSize: 5, color: wr >= 80 ? '#00ff88' : wr >= 50 ? '#ffaa00' : '#ff4444' }}>{wr}%</span>
      </div>
    </div>
  )
}

function AgentCard({ agent, onClick, allStats }: { agent: Agent; onClick: () => void; allStats: AllStats }) {
  const st = statusConfig[agent.status as keyof typeof statusConfig]
  const isTrader = TRADER_IDS.includes(agent.id)
  const traderStats = isTrader ? (allStats[agent.id] || null) : null
  return (
    <div className={`agent-card ${agent.status}`} onClick={onClick}>
      <PixelChar emoji={agent.emoji} status={agent.status} />
      <div className="pixel-desk" />
      <div style={{ fontSize: 7, color: agent.color, marginBottom: 4, textAlign: 'center' }}>
        {agent.name}
      </div>
      <div style={{ fontSize: 5, color: '#888', textAlign: 'center', marginBottom: 8, lineHeight: 1.8 }}>
        {agent.role}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
        <div className="status-dot" style={{ background: st.dot, boxShadow: agent.status === 'active' ? `0 0 6px ${st.dot}` : 'none' }} />
        <span style={{ fontSize: 5, color: st.color }}>{st.label}</span>
      </div>
      {isTrader && <TraderMiniStats stats={traderStats} />}
    </div>
  )
}

function TraderModalContent({ stats }: { stats: TraderStats | null }) {
  if (!stats) return (
    <div style={{ fontSize: 6, color: '#444', textAlign: 'center', padding: 16 }}>
      Нет данных
    </div>
  )
  const pnl = stats.total_pnl ?? stats.pnl ?? 0
  const pnlColor = pnl >= 0 ? '#00ff88' : '#ff4444'
  const wr = stats.win_rate ?? 0
  const updatedTime = stats.updated_at ? new Date(stats.updated_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '—'

  return (
    <div style={{ borderTop: '1px solid #222', paddingTop: 16 }}>
      {stats.strategy && (
        <div style={{ fontSize: 5, color: '#888', marginBottom: 12, textAlign: 'center', fontStyle: 'italic' }}>
          {stats.strategy}
        </div>
      )}

      <div style={{ fontSize: 6, color: '#555', marginBottom: 12, letterSpacing: 2 }}>── ПОКАЗАТЕЛИ ──</div>

      <Row label="БАЛАНС" value={`$${(stats.balance ?? 0).toFixed(2)}`} valueColor="#fff" />
      <Row label="PnL" value={`${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`} valueColor={pnlColor} />

      <div style={{ height: 1, background: '#1a1a1a', margin: '12px 0' }} />

      <Row label="ПОБЕДЫ" value={`${stats.bets_won ?? 0}`} valueColor="#00ff88" />
      <Row label="ПОРАЖЕНИЯ" value={`${stats.bets_lost ?? 0}`} valueColor="#ff4444" />
      <Row label="WIN RATE" value={`${wr}%`} valueColor={wr >= 80 ? '#00ff88' : wr >= 50 ? '#ffaa00' : '#ff4444'} />
      {(stats.bets_pending ?? 0) > 0 && <Row label="PENDING" value={`${stats.bets_pending}`} valueColor="#ffaa00" />}
      {(stats.snipes_today ?? 0) > 0 && <Row label="СНАЙПОВ СЕГОДНЯ" value={`${stats.snipes_today}`} valueColor="#00aaff" />}

      {stats.recent && stats.recent.length > 0 && (
        <>
          <div style={{ height: 1, background: '#1a1a1a', margin: '12px 0' }} />
          <div style={{ fontSize: 6, color: '#555', marginBottom: 8, letterSpacing: 2 }}>── ПОСЛЕДНИЕ ──</div>
          {stats.recent.slice(-5).reverse().map((t: any, i: number) => {
            const time = t.time ? new Date(t.time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : ''
            const icon = t.outcome === 'win' ? '✓' : t.outcome === 'loss' ? '✗' : '⏳'
            const color = t.outcome === 'win' ? '#00ff88' : t.outcome === 'loss' ? '#ff4444' : '#ffaa00'
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 5, color: '#555' }}>{time} {t.side}</span>
                <span style={{ fontSize: 5, color }}>
                  {icon} {t.pnl != null ? `${t.pnl >= 0 ? '+' : ''}$${Number(t.pnl).toFixed(2)}` : `$${Number(t.cost || 0).toFixed(2)}`}
                </span>
              </div>
            )
          })}
        </>
      )}

      <div style={{ marginTop: 16, fontSize: 5, color: '#333', textAlign: 'right' }}>
        UPD: {updatedTime}
      </div>
    </div>
  )
}

function Modal({ agent, onClose, allStats }: { agent: Agent; onClose: () => void; allStats: AllStats }) {
  const st = statusConfig[agent.status as keyof typeof statusConfig]
  const isTrader = TRADER_IDS.includes(agent.id)
  const traderStats = isTrader ? (allStats[agent.id] || null) : null
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', color: '#00ff88', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{agent.emoji}</div>
          <div style={{ fontSize: 10, color: agent.color, marginBottom: 8 }}>{agent.name}</div>
          <div style={{ fontSize: 6, color: '#888' }}>{agent.role}</div>
        </div>
        {isTrader ? (
          <TraderModalContent stats={traderStats} />
        ) : (
          <div style={{ borderTop: '1px solid #222', paddingTop: 16 }}>
            <Row label="СТАТУС" value={st.label} valueColor={st.color} />
            <Row label="ОТДЕЛ" value={agent.department.toUpperCase()} />
            <Row label="ЗАДАЧА" value={agent.lastTask} valueColor="#ccc" />
          </div>
        )}
        <div style={{ marginTop: 24, fontSize: 6, color: '#333', textAlign: 'center' }}>
          [НАЖМИ ВНЕ ОКНА ЧТОБЫ ЗАКРЫТЬ]
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, valueColor = '#fff' }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, gap: 16 }}>
      <span style={{ fontSize: 6, color: '#555', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 6, color: valueColor, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

export default function Home() {
  const [selected, setSelected] = useState<Agent | null>(null)
  const [allStats, setAllStats] = useState<AllStats>({})

  useEffect(() => {
    const fetchStats = () => {
      fetch('/api/trader')
        .then(r => r.json())
        .then(d => setAllStats(d || {}))
        .catch(() => {})
    }
    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ minHeight: '100vh', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 9, color: '#00ff88', letterSpacing: 4, marginBottom: 8 }} className="glow-green">
          ◈ КОРПОРАЦИЯ АЛЕКСАНДРА ◈
        </div>
        <div style={{ fontSize: 5, color: '#444', letterSpacing: 2 }}>
          AI CORP HQ v1.0 · {new Date().getFullYear()}
        </div>
        <div style={{ marginTop: 8, fontSize: 5, color: '#333' }}>
          {'> '}<span className="blink" style={{ color: '#00ff88' }}>_</span>
        </div>
        <Link href="/office" style={{
          display: 'inline-block', marginTop: 16, fontSize: 7,
          color: '#00aaff', textDecoration: 'none', border: '2px solid #00aaff44',
          padding: '8px 20px', fontFamily: '"Press Start 2P", monospace',
          transition: 'all 0.1s',
        }}>
          🏢 ОФИС
        </Link>
      </div>

      {/* Office grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 24,
        maxWidth: 1200,
        margin: '0 auto'
      }}>
        {departments.map(dept => {
          const deptAgents = agents.filter(a => a.department === dept.id)
          return (
            <div key={dept.id} className="dept-zone" style={{ borderColor: dept.color + '44' }}>
              <div className="dept-label" style={{ color: dept.color, borderColor: dept.color }}>
                {dept.label}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
                {deptAgents.map(agent => (
                  <AgentCard key={agent.id} agent={agent} onClick={() => setSelected(agent)} allStats={allStats} />
                ))}
                {deptAgents.length === 0 && (
                  <div style={{ fontSize: 6, color: '#333', textAlign: 'center', padding: 24, border: '1px dashed #222' }}>
                    ВАКАНСИЯ
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: 48, fontSize: 5, color: '#222' }}>
        ВСЕГО СОТРУДНИКОВ: {agents.length} · АКТИВНЫХ: {agents.filter(a => a.status === 'active').length}
      </div>

      {selected && <Modal agent={selected} onClose={() => setSelected(null)} allStats={allStats} />}
    </div>
  )
}
