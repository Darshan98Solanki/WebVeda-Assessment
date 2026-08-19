import * as React from "react"

type Falloff = "smooth" | "linear"

type CursorGridProps = {
    cellSize?: number
    color?: string
    radius?: number
    falloff?: Falloff
    holdTime?: number
    fadeDuration?: number
    lineWidth?: number
    maxOpacity?: number
    fillOpacity?: number
    gridOpacity?: number
    cellRadius?: number
    clickPulse?: boolean
    pulseSpeed?: number
}

type CellState = {
    // Intensity (0-1) the cell had the last time the cursor was over it,
    // frozen in place for holdTime ms and then eased down to 0 over
    // fadeDuration ms. lastHotAt is when that freeze started.
    frozenIntensity: number
    lastHotAt: number
}

type Pulse = {
    x: number
    y: number
    startedAt: number
}

// Fills its positioned parent and paints a grid whose cells light up near
// the cursor — each cell brightens by distance-to-cursor (falloff), then
// holds its last brightness for holdTime ms before easing out over
// fadeDuration ms, so the glow trails the pointer instead of snapping off.
// Meant purely as a decorative backdrop: the canvas ignores pointer events
// itself, tracking the cursor via window listeners instead, so it never
// blocks clicks on whatever sits in front of it.
export default function CursorGrid({
    cellSize = 40,
    color = "#ffffff",
    radius = 120,
    falloff = "smooth",
    holdTime = 300,
    fadeDuration = 600,
    lineWidth = 1,
    maxOpacity = 0.8,
    fillOpacity = 0.15,
    gridOpacity = 0.05,
    cellRadius = 4,
    clickPulse = false,
    pulseSpeed = 500,
}: CursorGridProps) {
    const canvasRef = React.useRef<HTMLCanvasElement>(null)

    React.useEffect(() => {
        const canvas = canvasRef.current
        const parent = canvas?.parentElement
        if (!canvas || !parent) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        let width = 0
        let height = 0
        let cols = 0
        let rows = 0
        let cellStates: CellState[] = []

        const resize = () => {
            const rect = parent.getBoundingClientRect()
            const dpr = window.devicePixelRatio || 1
            width = rect.width
            height = rect.height
            canvas.width = Math.max(1, Math.round(width * dpr))
            canvas.height = Math.max(1, Math.round(height * dpr))
            canvas.style.width = `${width}px`
            canvas.style.height = `${height}px`
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

            cols = Math.ceil(width / cellSize) + 1
            rows = Math.ceil(height / cellSize) + 1
            // Grid state resets on resize rather than being remapped —
            // simplest option, and a resize is rare enough (viewport
            // change) that losing an in-flight glow is unnoticeable.
            cellStates = new Array(cols * rows).fill(null).map(() => ({
                frozenIntensity: 0,
                lastHotAt: -Infinity,
            }))
        }

        resize()
        const resizeObserver = new ResizeObserver(resize)
        resizeObserver.observe(parent)

        let pointer: { x: number; y: number } | null = null

        const updatePointer = (clientX: number, clientY: number) => {
            const rect = canvas.getBoundingClientRect()
            const x = clientX - rect.left
            const y = clientY - rect.top
            pointer = x >= 0 && x <= rect.width && y >= 0 && y <= rect.height ? { x, y } : null
        }

        const handlePointerMove = (event: PointerEvent) => updatePointer(event.clientX, event.clientY)
        const handlePointerLeave = () => {
            pointer = null
        }

        const pulses: Pulse[] = []
        const handlePointerDown = (event: PointerEvent) => {
            if (!clickPulse) return
            const rect = canvas.getBoundingClientRect()
            const x = event.clientX - rect.left
            const y = event.clientY - rect.top
            if (x < 0 || x > rect.width || y < 0 || y > rect.height) return
            pulses.push({ x, y, startedAt: performance.now() })
        }

        window.addEventListener("pointermove", handlePointerMove)
        window.addEventListener("pointerdown", handlePointerDown)
        canvas.addEventListener("pointerleave", handlePointerLeave)

        const applyFalloff = (t: number) => {
            const clamped = Math.min(Math.max(1 - t, 0), 1)
            return falloff === "linear" ? clamped : clamped * clamped * (3 - 2 * clamped)
        }

        const hexToRgb = (hex: string) => {
            const normalized = hex.replace("#", "")
            const full =
                normalized.length === 3
                    ? normalized
                          .split("")
                          .map((c) => c + c)
                          .join("")
                    : normalized
            const int = parseInt(full, 16)
            return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 }
        }
        const rgb = hexToRgb(color)
        const rgba = (alpha: number) => `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`

        const drawCell = (x: number, y: number, intensity: number) => {
            if (intensity <= 0) return
            if (cellRadius > 0) {
                ctx.beginPath()
                ctx.roundRect(x, y, cellSize, cellSize, cellRadius)
            }
            if (fillOpacity > 0) {
                ctx.fillStyle = rgba(fillOpacity * intensity)
                if (cellRadius > 0) {
                    ctx.fill()
                } else {
                    ctx.fillRect(x, y, cellSize, cellSize)
                }
            }
            if (lineWidth > 0 && maxOpacity > 0) {
                ctx.lineWidth = lineWidth
                ctx.strokeStyle = rgba(maxOpacity * intensity)
                if (cellRadius > 0) {
                    ctx.stroke()
                } else {
                    ctx.strokeRect(x, y, cellSize, cellSize)
                }
            }
        }

        let animationFrameId = 0
        const maxPulseRadius = Math.hypot(width, height) || 1
        const pulseBandWidth = Math.max(radius * 0.6, cellSize)

        const render = () => {
            ctx.clearRect(0, 0, width, height)

            if (gridOpacity > 0) {
                ctx.strokeStyle = rgba(gridOpacity)
                ctx.lineWidth = lineWidth
                for (let col = 0; col <= cols; col++) {
                    const x = col * cellSize
                    ctx.beginPath()
                    ctx.moveTo(x, 0)
                    ctx.lineTo(x, height)
                    ctx.stroke()
                }
                for (let row = 0; row <= rows; row++) {
                    const y = row * cellSize
                    ctx.beginPath()
                    ctx.moveTo(0, y)
                    ctx.lineTo(width, y)
                    ctx.stroke()
                }
            }

            const now = performance.now()

            // Drop pulses once their ring has expanded past the canvas
            // diagonal — nothing further out could still be visible.
            for (let i = pulses.length - 1; i >= 0; i--) {
                const elapsedSeconds = (now - pulses[i].startedAt) / 1000
                if (elapsedSeconds * pulseSpeed > maxPulseRadius + pulseBandWidth) {
                    pulses.splice(i, 1)
                }
            }

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const x = col * cellSize
                    const y = row * cellSize
                    const centerX = x + cellSize / 2
                    const centerY = y + cellSize / 2
                    const state = cellStates[row * cols + col]

                    let cursorIntensity = 0
                    if (pointer) {
                        const dist = Math.hypot(centerX - pointer.x, centerY - pointer.y)
                        if (dist <= radius) {
                            cursorIntensity = applyFalloff(dist / radius)
                            state.frozenIntensity = cursorIntensity
                            state.lastHotAt = now
                        }
                    }
                    if (cursorIntensity === 0 && state.lastHotAt !== -Infinity) {
                        const elapsed = now - state.lastHotAt
                        if (elapsed <= holdTime) {
                            cursorIntensity = state.frozenIntensity
                        } else if (elapsed <= holdTime + fadeDuration) {
                            const fadeT = (elapsed - holdTime) / fadeDuration
                            cursorIntensity = state.frozenIntensity * (1 - fadeT)
                        }
                    }

                    let pulseIntensity = 0
                    for (const pulse of pulses) {
                        const ringRadius = ((now - pulse.startedAt) / 1000) * pulseSpeed
                        const dist = Math.hypot(centerX - pulse.x, centerY - pulse.y)
                        const distFromRing = Math.abs(dist - ringRadius)
                        if (distFromRing <= pulseBandWidth / 2) {
                            const fade = Math.max(1 - ringRadius / maxPulseRadius, 0)
                            const bandIntensity = applyFalloff(distFromRing / (pulseBandWidth / 2)) * fade
                            pulseIntensity = Math.max(pulseIntensity, bandIntensity)
                        }
                    }

                    drawCell(x, y, Math.max(cursorIntensity, pulseIntensity))
                }
            }

            animationFrameId = window.requestAnimationFrame(render)
        }

        render()

        return () => {
            window.cancelAnimationFrame(animationFrameId)
            resizeObserver.disconnect()
            window.removeEventListener("pointermove", handlePointerMove)
            window.removeEventListener("pointerdown", handlePointerDown)
            canvas.removeEventListener("pointerleave", handlePointerLeave)
        }
    }, [
        cellSize,
        color,
        radius,
        falloff,
        holdTime,
        fadeDuration,
        lineWidth,
        maxOpacity,
        fillOpacity,
        gridOpacity,
        cellRadius,
        clickPulse,
        pulseSpeed,
    ])

    return (
        <canvas
            ref={canvasRef}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        />
    )
}
