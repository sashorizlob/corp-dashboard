'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import agentsData from '../../data/agents.json'

type Agent = typeof agentsData[0]

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: 'АКТИВЕН', color: '#00ff88' },
  busy: { label: 'ЗАНЯТ', color: '#ffaa00' },
  offline: { label: 'ОФЛАЙН', color: '#555' },
}

// Room layout config: positions in the 800x600 canvas
const rooms: { id: string; label: string; x: number; y: number; w: number; h: number; color: string }[] = [
  { id: 'boss',         label: 'КАБИНЕТ АЛЕКСАНДРА', x: 0,   y: 0,   w: 800, h: 180, color: '#00ff88' },
  { id: 'reception',    label: 'РЕСЕПШН',            x: 0,   y: 180, w: 300, h: 160, color: '#00aaff' },
  { id: 'headquarters', label: 'ШТАБ / КЕНТ',        x: 300, y: 180, w: 500, h: 160, color: '#00ff88' },
  { id: 'work',         label: 'РАБОЧИЙ ОТДЕЛ',      x: 0,   y: 340, w: 560, h: 140, color: '#ffaa00' },
  { id: 'analytics',    label: 'АНАЛИТИКА',          x: 560, y: 340, w: 240, h: 140, color: '#ff00aa' },
  { id: 'personal',     label: 'ЛИЧНЫЙ ОТДЕЛ',       x: 0,   y: 480, w: 800, h: 120, color: '#aa00ff' },
]

// Agent positions in canvas
const agentPositions: Record<string, { x: number; y: number; room: string }> = {
  kent:      { x: 550, y: 260, room: 'headquarters' },
  secretary: { x: 150, y: 260, room: 'reception' },
  work1:     { x: 280, y: 410, room: 'work' },
  analyst:   { x: 680, y: 410, room: 'analytics' },
  personal1: { x: 400, y: 540, room: 'personal' },
}

// Boss (Alexander) - not in agents.json, placed manually
const bossPos = { x: 400, y: 90 }

export default function OfficePage() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<any>(null)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)

  useEffect(() => {
    if (!canvasRef.current || gameRef.current) return

    let destroyed = false

    import('phaser').then((Phaser) => {
      if (destroyed) return

      const TILE = 16 // tile size for pixel grid feel

      class OfficeScene extends Phaser.Scene {
        private agentSprites: Map<string, Phaser.GameObjects.Container> = new Map()
        private time_counter = 0

        constructor() {
          super({ key: 'OfficeScene' })
        }

        create() {
          // Draw floor
          this.add.rectangle(400, 300, 800, 600, 0x1a1a2e).setOrigin(0.5)

          // Draw rooms
          for (const room of rooms) {
            // Floor tile pattern
            for (let tx = room.x; tx < room.x + room.w; tx += TILE) {
              for (let ty = room.y; ty < room.y + room.h; ty += TILE) {
                const shade = ((tx / TILE + ty / TILE) % 2 === 0) ? 0x1a1a2e : 0x16182e
                this.add.rectangle(tx + TILE / 2, ty + TILE / 2, TILE - 1, TILE - 1, shade)
              }
            }

            // Walls (top and left borders)
            const wallColor = Phaser.Display.Color.HexStringToColor(room.color).color
            this.add.rectangle(room.x + room.w / 2, room.y, room.w, 3, wallColor).setAlpha(0.6)
            this.add.rectangle(room.x, room.y + room.h / 2, 3, room.h, wallColor).setAlpha(0.4)
            // Right wall
            this.add.rectangle(room.x + room.w, room.y + room.h / 2, 3, room.h, wallColor).setAlpha(0.4)
            // Bottom wall
            this.add.rectangle(room.x + room.w / 2, room.y + room.h, room.w, 3, wallColor).setAlpha(0.3)

            // Room label
            const labelText = this.add.text(room.x + 10, room.y + 8, room.label, {
              fontSize: '8px',
              fontFamily: '"Press Start 2P", monospace',
              color: room.color,
            }).setAlpha(0.7)
          }

          // Outer border
          const border = this.add.rectangle(400, 300, 798, 598)
          border.setStrokeStyle(2, 0x00ff88, 0.5)
          border.setFillStyle(0x000000, 0)

          // Draw boss (Alexander)
          this.drawBoss()

          // Draw agents
          for (const agent of agentsData) {
            const pos = agentPositions[agent.id]
            if (!pos) continue
            this.drawAgent(agent, pos.x, pos.y)
          }
        }

        drawBoss() {
          const x = bossPos.x
          const y = bossPos.y
          const container = this.add.container(x, y)

          // Big desk
          const desk = this.add.rectangle(0, 16, 80, 20, 0x8B6914)
          const deskTop = this.add.rectangle(0, 8, 76, 4, 0x6B4F10)
          // Monitor
          const monitor = this.add.rectangle(0, 2, 20, 14, 0x222244)
          const screen = this.add.rectangle(0, 2, 16, 10, 0x0d0d2a)
          const screenGlow = this.add.rectangle(0, 2, 16, 10, 0x00ff88).setAlpha(0.1)

          // Boss character - bigger
          const body = this.add.rectangle(0, -16, 16, 20, 0x00ff88)
          const head = this.add.rectangle(0, -30, 12, 12, 0xffcc99)
          // Crown/hat
          const hat = this.add.rectangle(0, -38, 14, 4, 0xffd700)

          // Label
          const label = this.add.text(0, 38, '👤 Александр', {
            fontSize: '7px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#00ff88',
          }).setOrigin(0.5)

          // Title
          const title = this.add.text(0, 52, 'CEO / Founder', {
            fontSize: '5px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#888',
          }).setOrigin(0.5)

          // Glow effect for boss
          const glow = this.add.rectangle(0, -16, 24, 28, 0x00ff88).setAlpha(0.08)

          container.add([desk, deskTop, monitor, screen, screenGlow, glow, body, head, hat, label, title])

          // Idle animation
          this.tweens.add({
            targets: [body, head, hat, glow],
            y: '-=2',
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          })
        }

        drawAgent(agent: Agent, x: number, y: number) {
          const container = this.add.container(x, y)
          const isActive = agent.status === 'active'
          const agentColor = Phaser.Display.Color.HexStringToColor(agent.color).color
          const alpha = agent.status === 'offline' ? 0.4 : 1

          // Desk
          const desk = this.add.rectangle(0, 14, 48, 14, 0x8B6914).setAlpha(alpha)
          const deskLeg1 = this.add.rectangle(-18, 24, 4, 10, 0x6B4F10).setAlpha(alpha)
          const deskLeg2 = this.add.rectangle(18, 24, 4, 10, 0x6B4F10).setAlpha(alpha)
          // Monitor
          const monitor = this.add.rectangle(0, 4, 14, 10, 0x222244).setAlpha(alpha)
          const screen = this.add.rectangle(0, 4, 10, 7, isActive ? 0x0d2a0d : 0x0d0d2a).setAlpha(alpha)

          // Character body
          const body = this.add.rectangle(0, -10, 12, 16, agentColor).setAlpha(alpha)
          // Head
          const head = this.add.rectangle(0, -22, 10, 10, 0xffcc99).setAlpha(alpha)
          // Eyes (blink animation targets)
          const eyeL = this.add.rectangle(-2, -22, 2, 2, 0x111111).setAlpha(alpha)
          const eyeR = this.add.rectangle(2, -22, 2, 2, 0x111111).setAlpha(alpha)

          // Neon glow for active agents
          let glow: Phaser.GameObjects.Rectangle | null = null
          if (isActive) {
            glow = this.add.rectangle(0, -10, 20, 24, agentColor).setAlpha(0.1)
          }

          // Status indicator
          const statusDot = this.add.rectangle(20, -26, 6, 6,
            isActive ? 0x00ff88 : (agent.status === 'busy' ? 0xffaa00 : 0x333333)
          )
          if (isActive) {
            statusDot.setAlpha(1)
          }

          // Agent name
          const nameText = this.add.text(0, 34, `${agent.emoji} ${agent.name}`, {
            fontSize: '6px',
            fontFamily: '"Press Start 2P", monospace',
            color: isActive ? agent.color : '#555',
          }).setOrigin(0.5)

          const items: Phaser.GameObjects.GameObject[] = [
            desk, deskLeg1, deskLeg2, monitor, screen,
          ]
          if (glow) items.push(glow)
          items.push(body, head, eyeL, eyeR, statusDot, nameText)
          container.add(items)

          // Idle bob animation for active agents
          if (isActive) {
            this.tweens.add({
              targets: [body, head, eyeL, eyeR],
              y: '-=2',
              duration: 1200 + Math.random() * 600,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.easeInOut',
            })

            // Glow pulse
            if (glow) {
              this.tweens.add({
                targets: glow,
                alpha: 0.2,
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
              })
            }

            // Status dot pulse
            this.tweens.add({
              targets: statusDot,
              alpha: 0.3,
              duration: 800,
              yoyo: true,
              repeat: -1,
            })

            // Screen flicker
            this.tweens.add({
              targets: screen,
              alpha: 0.6,
              duration: 2000 + Math.random() * 1000,
              yoyo: true,
              repeat: -1,
            })
          }

          // Blink animation (all agents that aren't offline)
          if (agent.status !== 'offline') {
            this.time.addEvent({
              delay: 2000 + Math.random() * 3000,
              loop: true,
              callback: () => {
                eyeL.setAlpha(0)
                eyeR.setAlpha(0)
                this.time.delayedCall(150, () => {
                  eyeL.setAlpha(alpha)
                  eyeR.setAlpha(alpha)
                })
              },
            })
          }

          // Click interaction
          const hitArea = this.add.rectangle(0, 0, 60, 70, 0xffffff, 0)
            .setInteractive({ useHandCursor: true })
          container.add(hitArea)

          hitArea.on('pointerover', () => {
            nameText.setColor('#ffffff')
            container.setScale(1.05)
          })
          hitArea.on('pointerout', () => {
            nameText.setColor(isActive ? agent.color : '#555')
            container.setScale(1)
          })
          hitArea.on('pointerdown', () => {
            // Dispatch custom event to React
            window.dispatchEvent(new CustomEvent('agent-click', { detail: agent }))
          })

          this.agentSprites.set(agent.id, container)
        }
      }

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: canvasRef.current!,
        backgroundColor: '#0d0d1a',
        pixelArt: true,
        scene: OfficeScene,
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
      }

      gameRef.current = new Phaser.Game(config)
    })

    // Listen for agent clicks from Phaser
    const handler = (e: Event) => {
      const agent = (e as CustomEvent).detail as Agent
      setSelectedAgent(agent)
    }
    window.addEventListener('agent-click', handler)

    return () => {
      destroyed = true
      window.removeEventListener('agent-click', handler)
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
      }
    }
  }, [])

  const st = selectedAgent ? statusConfig[selectedAgent.status] || statusConfig.offline : null

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: 820, marginBottom: 16 }}>
        <Link href="/" style={{ fontSize: 7, color: '#00ff88', textDecoration: 'none', fontFamily: '"Press Start 2P", monospace' }}>
          ◀ СТРУКТУРА
        </Link>
        <div style={{ fontSize: 8, color: '#00ff88', fontFamily: '"Press Start 2P", monospace', letterSpacing: 2 }}>
          🏢 ОФИС
        </div>
        <div style={{ fontSize: 5, color: '#444', fontFamily: '"Press Start 2P", monospace' }}>
          PHASER v3
        </div>
      </div>

      {/* Phaser canvas */}
      <div
        ref={canvasRef}
        style={{
          width: 800,
          maxWidth: '100%',
          border: '2px solid #00ff8844',
          boxShadow: '0 0 30px rgba(0,255,136,0.15)',
          imageRendering: 'pixelated',
        }}
      />

      {/* Instructions */}
      <div style={{ marginTop: 12, fontSize: 5, color: '#333', fontFamily: '"Press Start 2P", monospace', textAlign: 'center' }}>
        НАЖМИ НА АГЕНТА ЧТОБЫ ОТКРЫТЬ ИНФОРМАЦИЮ
      </div>

      {/* Info panel overlay */}
      {selectedAgent && st && (
        <div className="modal-overlay" onClick={() => setSelectedAgent(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <button
              onClick={() => setSelectedAgent(null)}
              style={{
                position: 'absolute', top: 12, right: 16,
                background: 'none', border: 'none', color: '#00ff88',
                fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              ✕
            </button>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>{selectedAgent.emoji}</div>
              <div style={{ fontSize: 10, color: selectedAgent.color, marginBottom: 6, fontFamily: '"Press Start 2P", monospace' }}>
                {selectedAgent.name}
              </div>
              <div style={{ fontSize: 6, color: '#888', fontFamily: '"Press Start 2P", monospace' }}>
                {selectedAgent.role}
              </div>
            </div>
            <div style={{ borderTop: '1px solid #222', paddingTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 6, color: '#555', fontFamily: '"Press Start 2P", monospace' }}>СТАТУС</span>
                <span style={{ fontSize: 6, color: st.color, fontFamily: '"Press Start 2P", monospace' }}>{st.label}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 6, color: '#555', fontFamily: '"Press Start 2P", monospace' }}>ОТДЕЛ</span>
                <span style={{ fontSize: 6, color: '#fff', fontFamily: '"Press Start 2P", monospace' }}>{selectedAgent.department.toUpperCase()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 6, color: '#555', fontFamily: '"Press Start 2P", monospace' }}>ЗАДАЧА</span>
                <span style={{ fontSize: 6, color: '#ccc', fontFamily: '"Press Start 2P", monospace' }}>{selectedAgent.lastTask}</span>
              </div>
            </div>
            <div style={{ marginTop: 16, fontSize: 5, color: '#333', textAlign: 'center', fontFamily: '"Press Start 2P", monospace' }}>
              [НАЖМИ ВНЕ ОКНА ЧТОБЫ ЗАКРЫТЬ]
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
