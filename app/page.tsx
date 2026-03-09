'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import agents from '../data/agents.json'

type Agent = typeof agents[0]

type TraderStats = {
  balance: number
  pnl: number
  bets_total: number
  bets_won: number
  bets_pending: number
  last_bet?: { time: string; side: string; amount: number; status: string }
  last_win?: { time: string; side: string; amount: number }
  updated_at: string
}

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
  const wr = stats.bets_total > 0 ? Math.round((stats.bets_won / (stats.bets_total - stats.bets_pending)) * 100) : 0
  const pnlColor = stats.pnl >= 0 ? '#00ff88' : '#ff4444'
  return (
    <div style={{ marginTop: 8, borderTop: '1px solid #1a1a1a', paddingTop: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 5, color: '#555' }}>BAL</span>
        <span style={{ fontSize: 5, color: '#fff' }}>${stats.balance.toFixed(2)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 5, color: '#555' }}>PnL</span>
        <span style={{ fontSize: 5, color: pnlColor }}>{stats.pnl >= 0 ? '+' : ''}{stats.pnl.toFixed(2)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 5, color: '#555' }}>WR</span>
        <span style={{ fontSize: 5, color: wr >= 55 ? '#00ff88' : wr >= 40 ? '#ffaa00' : '#ff4444' }}>{isNaN(wr) ? '—' : `${wr}%`}</span>
      </div>
    </div>
  )
}

function AgentCard({ agent, onClick, traderStats }: { agent: Agent; onClick: () => void; traderStats: TraderStats | null }) {
  const st = statusConfig[agent.status as keyof typeof statusConfig]
  const isTrader = agent.id === 'poly-trader'
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
      Загрузка данных...
    </div>
  )
  const betsResolved = stats.bets_total - stats.bets_pending
  const wr = betsResolved > 0 ? Math.round((stats.bets_won / betsResolved) * 100) : 0
  const pnlColor = stats.pnl >= 0 ? '#00ff88' : '#ff4444'
  const updatedTime = new Date(stats.updated_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{ borderTop: '1px solid #222', paddingTop: 16 }}>
      <div style={{ fontSize: 6, color: '#555', marginBottom: 12, letterSpacing: 2 }}>── ТОРГОВЫЕ ПОКАЗАТЕЛИ ──</div>

      <Row label="БАЛАНС" value={`$${stats.balance.toFixed(4)} USDC.e`} valueColor="#fff" />
      <Row label="PnL" value={`${stats.pnl >= 0 ? '+' : ''}$${stats.pnl.toFixed(4)}`} valueColor={pnlColor} />

      <div style={{ height: 1, background: '#1a1a1a', margin: '12px 0' }} />

      <Row label="ВСЕГО СТАВОК" value={`${stats.bets_total}`} />
      <Row label="ПОБЕДЫ" value={`${stats.bets_won}`} valueColor="#00ff88" />
      <Row label="WIN RATE" value={isNaN(wr) ? '—' : `${wr}%`} valueColor={wr >= 55 ? '#00ff88' : wr >= 40 ? '#ffaa00' : '#ff4444'} />
      {stats.bets_pending > 0 && <Row label="В ОЖИДАНИИ" value={`${stats.bets_pending}`} valueColor="#ffaa00" />}

      {stats.last_bet && (
        <>
          <div style={{ height: 1, background: '#1a1a1a', margin: '12px 0' }} />
          <div style={{ fontSize: 6, color: '#555', marginBottom: 12, letterSpacing: 2 }}>── ПОСЛЕДНЯЯ СТАВКА ──</div>
          <Row label="ВРЕМЯ" value={stats.last_bet.time} />
          <Row label="НАПРАВЛЕНИЕ" value={stats.last_bet.side.toUpperCase()} valueColor={stats.last_bet.side === 'Up' ? '#00ff88' : '#ff6600'} />
          <Row label="СУММА" value={`$${stats.last_bet.amount.toFixed(2)}`} />
          <Row label="СТАТУС" value={
            stats.last_bet.status === 'pending' ? 'ОЖИДАНИЕ' :
            stats.last_bet.status === 'win' ? 'ПОБЕДА ✓' : 'ПРОИГРЫШ ✗'
          } valueColor={
            stats.last_bet.status === 'pending' ? '#ffaa00' :
            stats.last_bet.status === 'win' ? '#00ff88' : '#ff4444'
          } />
        </>
      )}

      {stats.last_win && (
        <>
          <div style={{ height: 1, background: '#1a1a1a', margin: '12px 0' }} />
          <div style={{ fontSize: 6, color: '#555', marginBottom: 12, letterSpacing: 2 }}>── ПОСЛЕДНИЙ ВЫИГРЫШ ──</div>
          <Row label="ВРЕМЯ" value={stats.last_win.time} />
          <Row label="СУММА" value={`+$${stats.last_win.amount.toFixed(2)}`} valueColor="#00ff88" />
        </>
      )}

      <div style={{ marginTop: 16, fontSize: 5, color: '#333', textAlign: 'right' }}>
        UPD: {updatedTime}
      </div>
    </div>
  )
}

function Modal({ agent, onClose, traderStats }: { agent: Agent; onClose: () => void; traderStats: TraderStats | null }) {
  const st = statusConfig[agent.status as keyof typeof statusConfig]
  const isTrader = agent.id === 'poly-trader'
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
  const [traderStats, setTraderStats] = useState<TraderStats | null>(null)

  useEffect(() => {
    const fetchStats = () => {
      fetch('/api/trader')
        .then(r => r.json())
        .then(d => setTraderStats(d))
        .catch(() => {})
    }
    fetchStats()
    const interval = setInterval(fetchStats, 30000) // обновляем каждые 30с
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
                  <AgentCard key={agent.id} agent={agent} onClick={() => setSelected(agent)} traderStats={traderStats} />
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

      {selected && <Modal agent={selected} onClose={() => setSelected(null)} traderStats={traderStats} />}
    </div>
  )
}
