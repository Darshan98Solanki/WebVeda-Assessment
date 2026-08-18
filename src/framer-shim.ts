/**
 * Local stand-in for Framer's own "framer" runtime module.
 *
 * SkillpathCourses.tsx imports `addPropertyControls` and `ControlType` from
 * "framer" because that's what Framer's code-component environment provides
 * when the file is pasted into a Framer project — that's the real target.
 * Outside Framer (i.e. here, running via Vite for local development and
 * preview) no such package exists, so `vite.config.ts` aliases "framer" to
 * this file instead. The two implementations only need to satisfy the same
 * import shape; the actual Properties-panel behavior only exists inside
 * Framer's canvas, which this shim doesn't attempt to fake.
 */

export const ControlType = {
    Color: "color",
    Number: "number",
    Enum: "enum",
    String: "string",
    Boolean: "boolean",
} as const

export function addPropertyControls(_component: unknown, _controls: unknown): void {
    // No-op locally — property controls have nothing to attach to outside
    // the Framer canvas's Properties panel.
}
