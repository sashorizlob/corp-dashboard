'use client'

import { useState } from 'react'
import agents from '../data/agents.json'

type Agent = typeof agents[0]

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

function AgentCard({ agent, onClick }: { agent: Agent; onClick: () => void }) {
  const st = statusConfig[agent.status as keyof typeof statusConfig]
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
    </div>
  )
}

function Modal({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const st = statusConfig[agent.status as keyof typeof statusConfig]
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', color: '#00ff88', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{agent.emoji}</div>
          <div style={{ fontSize: 10, color: agent.color, marginBottom: 8 }}>{agent.name}</div>
          <div style={{ fontSize: 6, color: '#888' }}>{agent.role}</div>
        </div>
        <div style={{ borderTop: '1px solid #222', paddingTop: 16 }}>
          <Row label="СТАТУС" value={st.label} valueColor={st.color} />
          <Row label="ОТДЕЛ" value={agent.department.toUpperCase()} />
          <Row label="ЗАДАЧА" value={agent.lastTask} valueColor="#ccc" />
        </div>
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
                  <AgentCard key={agent.id} agent={agent} onClick={() => setSelected(agent)} />
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

      {selected && <Modal agent={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
