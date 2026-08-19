import * as React from "react"

type FuzzyTextProps = {
    children: React.ReactNode
    fontSize?: number | string
    fontWeight?: string | number
    fontFamily?: string
    color?: string
    enableHover?: boolean
    baseIntensity?: number
    hoverIntensity?: number
}

// Draws its text onto a <canvas> by re-blitting the glyphs one scanline at a
// time with a small random horizontal jitter per frame — that jitter is the
// "fuzz". Redrawn every animation frame rather than once, so the distortion
// keeps flickering instead of settling into a static offset. Hovering (when
// enableHover is on) swaps the jitter amount from baseIntensity up to
// hoverIntensity for as long as the pointer sits over the rendered glyphs.
export default function FuzzyText({
    children,
    fontSize = "clamp(2rem, 8vw, 8rem)",
    fontWeight = 900,
    fontFamily = "inherit",
    color = "#fff",
    enableHover = true,
    baseIntensity = 0.18,
    hoverIntensity = 0.5,
}: FuzzyTextProps) {
    const canvasRef = React.useRef<HTMLCanvasElement>(null)

    React.useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        let animationFrameId = 0
        let isCancelled = false
        let cleanupInteraction = () => {}

        const init = async () => {
            // Wait for the real font to be loaded before measuring text with
            // it — measuring/painting against the fallback font first would
            // bake in wrong glyph widths for a frame or two.
            if (document.fonts?.ready) {
                await document.fonts.ready
            }
            if (isCancelled) return

            const computedFontFamily =
                fontFamily === "inherit"
                    ? window.getComputedStyle(canvas).fontFamily || "sans-serif"
                    : fontFamily

            const fontSizeStr = typeof fontSize === "number" ? `${fontSize}px` : fontSize

            // getComputedStyle only resolves CSS units (like the clamp()
            // default above) against a real element in the DOM, so a
            // throwaway span is the simplest way to turn fontSize into a
            // plain px number for the canvas measurements below.
            let numericFontSize: number
            if (typeof fontSize === "number") {
                numericFontSize = fontSize
            } else {
                const measuringEl = document.createElement("span")
                measuringEl.style.fontSize = fontSize
                document.body.appendChild(measuringEl)
                numericFontSize = parseFloat(window.getComputedStyle(measuringEl).fontSize)
                document.body.removeChild(measuringEl)
            }

            const text = React.Children.toArray(children).join("")

            // Text is painted once onto an offscreen canvas at full
            // resolution; the visible canvas then only ever copies rows out
            // of it with a jittered x offset, instead of re-running fillText
            // every frame.
            const offscreen = document.createElement("canvas")
            const offCtx = offscreen.getContext("2d")
            if (!offCtx) return

            offCtx.font = `${fontWeight} ${fontSizeStr} ${computedFontFamily}`
            offCtx.textBaseline = "alphabetic"
            const metrics = offCtx.measureText(text)

            const actualLeft = metrics.actualBoundingBoxLeft ?? 0
            const actualRight = metrics.actualBoundingBoxRight ?? metrics.width
            const actualAscent = metrics.actualBoundingBoxAscent ?? numericFontSize
            const actualDescent = metrics.actualBoundingBoxDescent ?? numericFontSize * 0.2

            const textBoxWidth = Math.ceil(actualLeft + actualRight)
            const tightHeight = Math.ceil(actualAscent + actualDescent)

            const extraWidthBuffer = 10
            const offscreenWidth = textBoxWidth + extraWidthBuffer

            offscreen.width = offscreenWidth
            offscreen.height = tightHeight

            const xOffset = extraWidthBuffer / 2
            offCtx.font = `${fontWeight} ${fontSizeStr} ${computedFontFamily}`
            offCtx.textBaseline = "alphabetic"
            offCtx.fillStyle = color
            offCtx.fillText(text, xOffset - actualLeft, actualAscent)

            // The visible canvas is padded well beyond the tight text box
            // (horizontalMargin, fuzzRange) so the jitter has room to push
            // glyphs sideways without clipping against the canvas edge.
            const horizontalMargin = 50
            canvas.width = offscreenWidth + horizontalMargin * 2
            canvas.height = tightHeight
            ctx.translate(horizontalMargin, 0)

            const interactiveLeft = horizontalMargin + xOffset
            const interactiveTop = 0
            const interactiveRight = interactiveLeft + textBoxWidth
            const interactiveBottom = interactiveTop + tightHeight

            let isHovering = false
            const fuzzRange = 30

            const render = () => {
                if (isCancelled) return
                ctx.clearRect(
                    -fuzzRange,
                    -fuzzRange,
                    offscreenWidth + fuzzRange * 2,
                    tightHeight + fuzzRange * 2,
                )
                const intensity = isHovering ? hoverIntensity : baseIntensity
                for (let row = 0; row < tightHeight; row++) {
                    const dx = Math.floor(intensity * (Math.random() - 0.5) * fuzzRange)
                    ctx.drawImage(offscreen, 0, row, offscreenWidth, 1, dx, row, offscreenWidth, 1)
                }
                animationFrameId = window.requestAnimationFrame(render)
            }

            render()

            const isInsideTextArea = (x: number, y: number) =>
                x >= interactiveLeft && x <= interactiveRight && y >= interactiveTop && y <= interactiveBottom

            const handleMouseMove = (event: MouseEvent) => {
                const rect = canvas.getBoundingClientRect()
                isHovering = isInsideTextArea(event.clientX - rect.left, event.clientY - rect.top)
            }
            const handleMouseLeave = () => {
                isHovering = false
            }
            const handleTouchMove = (event: TouchEvent) => {
                event.preventDefault()
                const rect = canvas.getBoundingClientRect()
                const touch = event.touches[0]
                isHovering = isInsideTextArea(touch.clientX - rect.left, touch.clientY - rect.top)
            }

            if (enableHover) {
                canvas.addEventListener("mousemove", handleMouseMove)
                canvas.addEventListener("mouseleave", handleMouseLeave)
                canvas.addEventListener("touchmove", handleTouchMove, { passive: false })

                cleanupInteraction = () => {
                    canvas.removeEventListener("mousemove", handleMouseMove)
                    canvas.removeEventListener("mouseleave", handleMouseLeave)
                    canvas.removeEventListener("touchmove", handleTouchMove)
                }
            }
        }

        init()

        return () => {
            isCancelled = true
            window.cancelAnimationFrame(animationFrameId)
            cleanupInteraction()
        }
    }, [children, fontSize, fontWeight, fontFamily, color, enableHover, baseIntensity, hoverIntensity])

    return <canvas ref={canvasRef} />
}
