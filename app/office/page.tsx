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

// Room layout: 900x650 canvas, no boss room
const rooms: { id: string; label: string; icon: string; x: number; y: number; w: number; h: number; color: string; floorTints: number[] }[] = [
  { id: 'reception',    label: '◆ РЕСЕПШН',      icon: '📋', x: 0,   y: 0,   w: 450, h: 220, color: '#00aaff', floorTints: [0x12142e, 0x14163a, 0x101230] },
  { id: 'headquarters', label: '★ ШТАБ',          icon: '🤝', x: 450, y: 0,   w: 450, h: 220, color: '#00ff88', floorTints: [0x0e1e18, 0x0c2218, 0x0a1a14] },
  { id: 'work',         label: '▲ РАБОЧИЙ ОТДЕЛ', icon: '🔧', x: 0,   y: 220, w: 450, h: 220, color: '#ffaa00', floorTints: [0x1e1a0e, 0x22180c, 0x1a160a] },
  { id: 'analytics',    label: '■ АНАЛИТИКА',     icon: '📊', x: 450, y: 220, w: 450, h: 220, color: '#ff00aa', floorTints: [0x1e0e1a, 0x220c18, 0x1a0a16] },
  { id: 'personal',     label: '● ЛИЧНЫЙ ОТДЕЛ',  icon: '🧬', x: 0,   y: 440, w: 900, h: 210, color: '#aa00ff', floorTints: [0x160e22, 0x1a0c26, 0x120a1e] },
]

// Agent positions
const agentPositions: Record<string, { x: number; y: number; room: string }> = {
  secretary: { x: 180, y: 130, room: 'reception' },
  kent:      { x: 680, y: 130, room: 'headquarters' },
  work1:     { x: 180, y: 340, room: 'work' },
  analyst:   { x: 680, y: 340, room: 'analytics' },
  personal1: { x: 450, y: 560, room: 'personal' },
}

export default function OfficePage() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<any>(null)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)

  useEffect(() => {
    if (!canvasRef.current || gameRef.current) return

    let destroyed = false

    import('phaser').then((Phaser) => {
      if (destroyed) return

      const W = 900
      const H = 650
      const TILE = 16
      const WALL = 6

      class OfficeScene extends Phaser.Scene {
        private agentSprites: Map<string, Phaser.GameObjects.Container> = new Map()

        constructor() {
          super({ key: 'OfficeScene' })
        }

        create() {
          // Background
          this.add.rectangle(W / 2, H / 2, W, H, 0x08080f).setOrigin(0.5)

          // Draw rooms
          for (const room of rooms) {
            this.drawRoom(room)
          }

          // Outer border glow
          const border = this.add.rectangle(W / 2, H / 2, W - 2, H - 2)
          border.setStrokeStyle(3, 0x00ff88, 0.4)
          border.setFillStyle(0x000000, 0)

          // Draw furniture & decorations
          this.drawFurniture()

          // Draw agents
          for (const agent of agentsData) {
            const pos = agentPositions[agent.id]
            if (!pos) continue
            this.drawAgent(agent, pos.x, pos.y)
          }

          // Draw vacant desk signs for offline agents
          for (const agent of agentsData) {
            if (agent.status === 'offline') {
              const pos = agentPositions[agent.id]
              if (pos) this.drawVacantSign(pos.x, pos.y)
            }
          }
        }

        drawRoom(room: typeof rooms[0]) {
          const { x, y, w, h, color, floorTints } = room

          // Checkerboard floor with subtle variation
          for (let tx = x; tx < x + w; tx += TILE) {
            for (let ty = y; ty < y + h; ty += TILE) {
              const idx = ((tx / TILE + ty / TILE) % 2 === 0) ? 0 : ((tx / TILE * 3 + ty / TILE * 7) % 3 === 0 ? 2 : 1)
              this.add.rectangle(tx + TILE / 2, ty + TILE / 2, TILE - 1, TILE - 1, floorTints[idx])
            }
          }

          // Thick pixel walls
          const wc = Phaser.Display.Color.HexStringToColor(color).color
          // Top wall
          this.add.rectangle(x + w / 2, y + WALL / 2, w, WALL, wc).setAlpha(0.5)
          // Left wall
          this.add.rectangle(x + WALL / 2, y + h / 2, WALL, h, wc).setAlpha(0.4)
          // Right wall
          this.add.rectangle(x + w - WALL / 2, y + h / 2, WALL, h, wc).setAlpha(0.35)
          // Bottom wall
          this.add.rectangle(x + w / 2, y + h - WALL / 2, w, WALL, wc).setAlpha(0.3)
          // Corner pieces
          for (const [cx, cy] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) {
            this.add.rectangle(cx, cy, WALL + 2, WALL + 2, wc).setAlpha(0.6)
          }

          // Neon room label (glowing text)
          const labelText = this.add.text(x + 16, y + 12, room.label, {
            fontSize: '9px',
            fontFamily: '"Press Start 2P", monospace',
            color: color,
          }).setAlpha(0.9)
          // Glow behind label
          const glowRect = this.add.rectangle(x + 16 + labelText.width / 2, y + 16, labelText.width + 8, 14, wc).setAlpha(0.06)
          // Neon pulse on label
          this.tweens.add({
            targets: labelText,
            alpha: 0.5,
            duration: 2000 + Math.random() * 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          })
          this.tweens.add({
            targets: glowRect,
            alpha: 0.12,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          })
        }

        drawFurniture() {
          // --- RUGS / CARPETS ---
          // Reception rug
          this.add.rectangle(180, 150, 140, 80, 0x1a2a4a).setAlpha(0.5)
          this.add.rectangle(180, 150, 134, 74, 0x1a2a4a).setAlpha(0.3) // inner border

          // HQ rug
          this.add.rectangle(680, 150, 140, 80, 0x1a3a2a).setAlpha(0.5)

          // Personal rug (large)
          this.add.rectangle(450, 560, 200, 100, 0x2a1a3a).setAlpha(0.4)

          // --- POTTED PLANTS ---
          this.drawPlant(60, 50)
          this.drawPlant(840, 50)
          this.drawPlant(60, 260)
          this.drawPlant(840, 260)
          this.drawPlant(60, 490)
          this.drawPlant(840, 490)
          this.drawPlant(420, 470)

          // --- WATER COOLER (reception area) ---
          this.drawWaterCooler(370, 170)

          // --- COFFEE MACHINE (work area) ---
          this.drawCoffeeMachine(370, 380)

          // --- BOOKSHELVES ---
          this.drawBookshelf(510, 30, 6) // HQ top wall
          this.drawBookshelf(50, 245, 5) // work top wall
          this.drawBookshelf(510, 245, 6) // analytics top wall

          // --- FILING CABINETS ---
          this.drawFilingCabinet(300, 185)
          this.drawFilingCabinet(850, 185)
          this.drawFilingCabinet(300, 400)
          this.drawFilingCabinet(850, 400)

          // --- MEETING TABLE (personal zone) ---
          this.drawMeetingTable(700, 560)

          // --- LIGHT BLOOMS for active agents ---
          for (const agent of agentsData) {
            if (agent.status === 'active') {
              const pos = agentPositions[agent.id]
              if (!pos) continue
              const bloom = this.add.circle(pos.x, pos.y, 60,
                Phaser.Display.Color.HexStringToColor(agent.color).color, 0.04)
              this.tweens.add({
                targets: bloom,
                alpha: 0.08,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 2500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
              })
            }
          }
        }

        drawPlant(x: number, y: number) {
          const container = this.add.container(x, y)
          // Pot
          container.add(this.add.rectangle(0, 8, 12, 10, 0x8B4513))
          container.add(this.add.rectangle(0, 2, 14, 4, 0x6B3410))
          // Leaves
          container.add(this.add.rectangle(0, -4, 8, 8, 0x228B22).setAlpha(0.9))
          container.add(this.add.rectangle(-5, -2, 6, 6, 0x2eaa2e).setAlpha(0.8))
          container.add(this.add.rectangle(5, -2, 6, 6, 0x2eaa2e).setAlpha(0.8))
          container.add(this.add.rectangle(0, -10, 4, 6, 0x33cc33).setAlpha(0.7))
          container.add(this.add.rectangle(-3, -8, 4, 4, 0x44dd44).setAlpha(0.6))
          container.add(this.add.rectangle(3, -8, 4, 4, 0x44dd44).setAlpha(0.6))

          // Subtle sway animation
          this.tweens.add({
            targets: container,
            angle: 2,
            duration: 3000 + Math.random() * 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          })
        }

        drawWaterCooler(x: number, y: number) {
          const c = this.add.container(x, y)
          // Body
          c.add(this.add.rectangle(0, 0, 14, 24, 0x4488cc).setAlpha(0.8))
          // Water jug
          c.add(this.add.rectangle(0, -14, 10, 10, 0x66bbff).setAlpha(0.6))
          c.add(this.add.rectangle(0, -14, 8, 8, 0x88ddff).setAlpha(0.3))
          // Base
          c.add(this.add.rectangle(0, 14, 16, 4, 0x336699))
          // Label
          c.add(this.add.text(0, 22, 'ВОДА', {
            fontSize: '4px', fontFamily: '"Press Start 2P", monospace', color: '#4488cc',
          }).setOrigin(0.5).setAlpha(0.6))
        }

        drawCoffeeMachine(x: number, y: number) {
          const c = this.add.container(x, y)
          // Body
          c.add(this.add.rectangle(0, 0, 16, 20, 0x4a3520))
          // Top
          c.add(this.add.rectangle(0, -12, 18, 4, 0x5a4530))
          // Screen
          c.add(this.add.rectangle(0, -4, 10, 6, 0x00ff88).setAlpha(0.3))
          // Cup area
          c.add(this.add.rectangle(0, 8, 12, 4, 0x3a2510))
          // Label
          c.add(this.add.text(0, 20, 'КОФЕ', {
            fontSize: '4px', fontFamily: '"Press Start 2P", monospace', color: '#aa8855',
          }).setOrigin(0.5).setAlpha(0.6))
          // Steam animation
          const steam1 = this.add.rectangle(-2, -18, 2, 4, 0xffffff).setAlpha(0.15)
          const steam2 = this.add.rectangle(2, -20, 2, 4, 0xffffff).setAlpha(0.1)
          c.add(steam1)
          c.add(steam2)
          this.tweens.add({
            targets: [steam1, steam2],
            y: '-=4',
            alpha: 0,
            duration: 2000,
            yoyo: true,
            repeat: -1,
          })
        }

        drawBookshelf(x: number, y: number, count: number) {
          const c = this.add.container(x, y)
          // Shelf frame
          const totalW = count * 10 + 4
          c.add(this.add.rectangle(totalW / 2 - 2, 0, totalW, 20, 0x5a3a1a).setAlpha(0.8))
          // Books (colored rectangles)
          const bookColors = [0xcc3333, 0x3366cc, 0x33aa33, 0xccaa33, 0xcc33aa, 0x33cccc, 0xaa6633, 0x6633aa]
          for (let i = 0; i < count; i++) {
            const bh = 10 + Math.floor(Math.random() * 6)
            const bc = bookColors[i % bookColors.length]
            c.add(this.add.rectangle(i * 10, 2 - bh / 2 + 6, 7, bh, bc).setAlpha(0.7))
          }
          // Shelf line
          c.add(this.add.rectangle(totalW / 2 - 2, 10, totalW, 2, 0x7a5a3a))
        }

        drawFilingCabinet(x: number, y: number) {
          const c = this.add.container(x, y)
          c.add(this.add.rectangle(0, 0, 14, 22, 0x555566))
          c.add(this.add.rectangle(0, -5, 10, 2, 0x888899)) // handle 1
          c.add(this.add.rectangle(0, 3, 10, 2, 0x888899))  // handle 2
          c.add(this.add.rectangle(0, 11, 10, 2, 0x888899)) // handle 3
        }

        drawMeetingTable(x: number, y: number) {
          const c = this.add.container(x, y)
          // Long table
          c.add(this.add.rectangle(0, 0, 100, 30, 0x5a4a3a))
          c.add(this.add.rectangle(0, 0, 96, 26, 0x6a5a4a).setAlpha(0.8))
          // Legs
          c.add(this.add.rectangle(-44, 18, 6, 8, 0x4a3a2a))
          c.add(this.add.rectangle(44, 18, 6, 8, 0x4a3a2a))
          // Chairs around table
          for (const cx of [-36, -12, 12, 36]) {
            c.add(this.add.rectangle(cx, -22, 10, 8, 0x444466).setAlpha(0.6))
            c.add(this.add.rectangle(cx, 22, 10, 8, 0x444466).setAlpha(0.6))
          }
          // Label
          c.add(this.add.text(0, 32, 'МИТИНГ', {
            fontSize: '4px', fontFamily: '"Press Start 2P", monospace', color: '#665544',
          }).setOrigin(0.5).setAlpha(0.5))
        }

        drawVacantSign(x: number, y: number) {
          const sign = this.add.text(x, y - 52, 'ВАКАНСИЯ', {
            fontSize: '5px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#ff4444',
            backgroundColor: '#1a0000',
            padding: { x: 4, y: 2 },
          }).setOrigin(0.5).setAlpha(0.7)

          this.tweens.add({
            targets: sign,
            alpha: 0.3,
            duration: 1500,
            yoyo: true,
            repeat: -1,
          })
        }

        drawAgent(agent: Agent, x: number, y: number) {
          const container = this.add.container(x, y)
          const isActive = agent.status === 'active'
          const isBusy = agent.status === 'busy'
          const isOnline = isActive || isBusy
          const agentColor = Phaser.Display.Color.HexStringToColor(agent.color).color
          const alpha = isOnline ? 1 : 0.35

          // === DESK (L-shaped) ===
          // Main desk surface
          const deskMain = this.add.rectangle(0, 18, 60, 16, 0x6B4F10).setAlpha(alpha)
          const deskTop = this.add.rectangle(0, 12, 56, 4, 0x8B6914).setAlpha(alpha * 0.8)
          // L-extension
          const deskL = this.add.rectangle(26, 8, 16, 20, 0x6B4F10).setAlpha(alpha * 0.9)
          // Desk legs
          const leg1 = this.add.rectangle(-26, 28, 4, 8, 0x5a3f0a).setAlpha(alpha)
          const leg2 = this.add.rectangle(26, 28, 4, 8, 0x5a3f0a).setAlpha(alpha)

          // === MONITOR ===
          const monitorStand = this.add.rectangle(0, 10, 4, 6, 0x333344).setAlpha(alpha)
          const monitorFrame = this.add.rectangle(0, 2, 22, 16, 0x222238).setAlpha(alpha)
          const screen = this.add.rectangle(0, 2, 18, 12, isOnline ? 0x0a1a0a : 0x0a0a14).setAlpha(alpha)

          // Animated code on screen for active agents
          const screenLines: Phaser.GameObjects.Rectangle[] = []
          if (isOnline) {
            for (let i = 0; i < 4; i++) {
              const lw = 4 + Math.floor(Math.random() * 10)
              const line = this.add.rectangle(-4 + lw / 2, -2 + i * 3, lw, 1, 0x00ff88).setAlpha(0.4)
              screenLines.push(line)
              container.add([]) // placeholder, added below
            }
          }

          // Screen glow
          const screenGlow = this.add.rectangle(0, 2, 22, 16, isOnline ? agentColor : 0x111122).setAlpha(isOnline ? 0.08 : 0.02)

          // === KEYBOARD ===
          const keyboard = this.add.rectangle(-4, 14, 14, 4, 0x333344).setAlpha(alpha * 0.8)

          // === CHAIR ===
          const chairSeat = this.add.rectangle(0, -4, 14, 8, 0x334455).setAlpha(alpha * 0.7)
          const chairBack = this.add.rectangle(0, -10, 14, 4, 0x3a4a5a).setAlpha(alpha * 0.8)

          // === CHARACTER ===
          // Body
          const body = this.add.rectangle(0, -16, 14, 18, agentColor).setAlpha(alpha)
          // Arms
          const armL = this.add.rectangle(-9, -12, 4, 10, agentColor).setAlpha(alpha * 0.8)
          const armR = this.add.rectangle(9, -12, 4, 10, agentColor).setAlpha(alpha * 0.8)
          // Head (rounder look - square with small squares for roundness)
          const head = this.add.rectangle(0, -30, 12, 12, 0xffcc99).setAlpha(alpha)
          const headTop = this.add.rectangle(0, -37, 10, 2, 0xffcc99).setAlpha(alpha) // round top
          // Hair
          const hair = this.add.rectangle(0, -37, 12, 4, agentColor).setAlpha(alpha * 0.7)
          // Eyes
          const eyeL = this.add.rectangle(-3, -30, 2, 3, 0x111111).setAlpha(alpha)
          const eyeR = this.add.rectangle(3, -30, 2, 3, 0x111111).setAlpha(alpha)
          // Mouth
          const mouth = this.add.rectangle(0, -26, 4, 1, 0xcc9988).setAlpha(alpha * 0.6)

          // === ACTIVE GLOW ===
          let glow: Phaser.GameObjects.Rectangle | null = null
          if (isActive) {
            glow = this.add.rectangle(0, -16, 26, 34, agentColor).setAlpha(0.08)
          }

          // === FLOATING EMOJI for active agents ===
          let floatingEmoji: Phaser.GameObjects.Text | null = null
          if (isActive) {
            floatingEmoji = this.add.text(0, -50, agent.emoji, {
              fontSize: '12px',
            }).setOrigin(0.5)
          }

          // === STATUS DOT ===
          const dotColor = isActive ? 0x00ff88 : (isBusy ? 0xffaa00 : 0x333333)
          const statusDot = this.add.circle(22, -34, 4, dotColor).setAlpha(isOnline ? 1 : 0.4)

          // === NAME LABEL ===
          const nameText = this.add.text(0, 40, `${agent.emoji} ${agent.name}`, {
            fontSize: '6px',
            fontFamily: '"Press Start 2P", monospace',
            color: isOnline ? agent.color : '#444',
          }).setOrigin(0.5)

          // Role subtitle
          const roleText = this.add.text(0, 50, agent.role, {
            fontSize: '4px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#444',
          }).setOrigin(0.5)

          // Assemble container
          const items: Phaser.GameObjects.GameObject[] = [
            deskMain, deskTop, deskL, leg1, leg2,
            chairSeat, chairBack,
            monitorStand, monitorFrame, screen,
            ...screenLines,
            screenGlow, keyboard,
          ]
          if (glow) items.push(glow)
          items.push(body, armL, armR, head, headTop, hair, eyeL, eyeR, mouth)
          if (floatingEmoji) items.push(floatingEmoji)
          items.push(statusDot, nameText, roleText)
          container.add(items)

          // === ANIMATIONS ===

          // Idle bob (all online agents)
          if (isOnline) {
            const bobTargets = [body, armL, armR, head, headTop, hair, eyeL, eyeR, mouth]
            if (floatingEmoji) bobTargets.push(floatingEmoji as any)
            this.tweens.add({
              targets: bobTargets,
              y: '-=2',
              duration: 1500 + Math.random() * 500,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.easeInOut',
            })
          }

          // Sitting bounce for active agents (every 2-3 sec)
          if (isActive) {
            this.time.addEvent({
              delay: 2000 + Math.random() * 1000,
              loop: true,
              callback: () => {
                this.tweens.add({
                  targets: [body, armL, armR, head, headTop, hair, eyeL, eyeR, mouth],
                  y: '-=1',
                  duration: 100,
                  yoyo: true,
                  ease: 'Bounce.easeOut',
                })
              },
            })
          }

          // Glow pulse
          if (glow) {
            this.tweens.add({
              targets: glow,
              alpha: 0.18,
              duration: 1200,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.easeInOut',
            })
          }

          // Floating emoji bob
          if (floatingEmoji) {
            this.tweens.add({
              targets: floatingEmoji,
              y: '-=4',
              duration: 1800,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.easeInOut',
            })
          }

          // Status dot pulse
          if (isOnline) {
            this.tweens.add({
              targets: statusDot,
              alpha: 0.3,
              duration: 900,
              yoyo: true,
              repeat: -1,
            })
          }

          // Screen code flicker (green text animation)
          if (isOnline && screenLines.length > 0) {
            this.time.addEvent({
              delay: 300 + Math.random() * 200,
              loop: true,
              callback: () => {
                for (const line of screenLines) {
                  line.setAlpha(0.2 + Math.random() * 0.5)
                  line.width = 4 + Math.floor(Math.random() * 10)
                }
              },
            })

            this.tweens.add({
              targets: screenGlow,
              alpha: 0.15,
              duration: 2000 + Math.random() * 1000,
              yoyo: true,
              repeat: -1,
            })
          }

          // Eye blink animation
          if (isOnline) {
            this.time.addEvent({
              delay: 2500 + Math.random() * 3000,
              loop: true,
              callback: () => {
                eyeL.setAlpha(0)
                eyeR.setAlpha(0)
                this.time.delayedCall(120, () => {
                  eyeL.setAlpha(alpha)
                  eyeR.setAlpha(alpha)
                })
              },
            })
          }

          // === CLICK INTERACTION ===
          const hitArea = this.add.rectangle(0, -5, 70, 90, 0xffffff, 0)
            .setInteractive({ useHandCursor: true })
          container.add(hitArea)

          hitArea.on('pointerover', () => {
            nameText.setColor('#ffffff')
            container.setScale(1.08)
          })
          hitArea.on('pointerout', () => {
            nameText.setColor(isOnline ? agent.color : '#444')
            container.setScale(1)
          })
          hitArea.on('pointerdown', () => {
            window.dispatchEvent(new CustomEvent('agent-click', { detail: agent }))
          })

          this.agentSprites.set(agent.id, container)
        }
      }

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: W,
        height: H,
        parent: canvasRef.current!,
        backgroundColor: '#08080f',
        pixelArt: true,
        scene: OfficeScene,
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
      }

      gameRef.current = new Phaser.Game(config)
    })

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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px', background: '#08080f' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: 920, marginBottom: 16 }}>
        <Link href="/" style={{ fontSize: 7, color: '#00ff88', textDecoration: 'none', fontFamily: '"Press Start 2P", monospace' }}>
          ◀ СТРУКТУРА
        </Link>
        <div style={{ fontSize: 9, color: '#00ff88', fontFamily: '"Press Start 2P", monospace', letterSpacing: 3, textShadow: '0 0 10px #00ff8866, 0 0 20px #00ff8833' }}>
          🏢 ПИКСЕЛЬ ОФИС
        </div>
        <div style={{ fontSize: 5, color: '#333', fontFamily: '"Press Start 2P", monospace' }}>
          CYBERPUNK v2
        </div>
      </div>

      {/* Phaser canvas */}
      <div
        ref={canvasRef}
        style={{
          width: 900,
          maxWidth: '100%',
          border: '2px solid #00ff8844',
          boxShadow: '0 0 40px rgba(0,255,136,0.12), 0 0 80px rgba(0,255,136,0.06), inset 0 0 40px rgba(0,255,136,0.03)',
          imageRendering: 'pixelated',
          borderRadius: 2,
        }}
      />

      {/* Instructions */}
      <div style={{ marginTop: 12, fontSize: 5, color: '#333', fontFamily: '"Press Start 2P", monospace', textAlign: 'center', textShadow: '0 0 8px #00ff8822' }}>
        НАЖМИ НА АГЕНТА ЧТОБЫ ОТКРЫТЬ ИНФОРМАЦИЮ
      </div>

      {/* Info panel overlay */}
      {selectedAgent && st && (
        <div className="modal-overlay" onClick={() => setSelectedAgent(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 420, border: `1px solid ${selectedAgent.color}33`, boxShadow: `0 0 30px ${selectedAgent.color}22` }}>
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
              <div style={{ fontSize: 44, marginBottom: 8, filter: 'drop-shadow(0 0 8px ' + selectedAgent.color + '44)' }}>{selectedAgent.emoji}</div>
              <div style={{ fontSize: 11, color: selectedAgent.color, marginBottom: 6, fontFamily: '"Press Start 2P", monospace', textShadow: `0 0 10px ${selectedAgent.color}44` }}>
                {selectedAgent.name}
              </div>
              <div style={{ fontSize: 6, color: '#777', fontFamily: '"Press Start 2P", monospace' }}>
                {selectedAgent.role}
              </div>
            </div>
            <div style={{ borderTop: '1px solid #1a1a2e', paddingTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 6, color: '#555', fontFamily: '"Press Start 2P", monospace' }}>СТАТУС</span>
                <span style={{ fontSize: 6, color: st.color, fontFamily: '"Press Start 2P", monospace', textShadow: `0 0 6px ${st.color}44` }}>{st.label}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 6, color: '#555', fontFamily: '"Press Start 2P", monospace' }}>ОТДЕЛ</span>
                <span style={{ fontSize: 6, color: '#ddd', fontFamily: '"Press Start 2P", monospace' }}>{selectedAgent.department.toUpperCase()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 6, color: '#555', fontFamily: '"Press Start 2P", monospace' }}>ЗАДАЧА</span>
                <span style={{ fontSize: 6, color: '#aaa', fontFamily: '"Press Start 2P", monospace' }}>{selectedAgent.lastTask}</span>
              </div>
            </div>
            <div style={{ marginTop: 16, fontSize: 5, color: '#282828', textAlign: 'center', fontFamily: '"Press Start 2P", monospace' }}>
              [НАЖМИ ВНЕ ОКНА ЧТОБЫ ЗАКРЫТЬ]
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
