import { Routes, Route } from "react-router-dom"
import HomePage from "./components/HomePage"
import NotFoundPage from "./components/NotFoundPage"
import ThemeToggle from "./components/ThemeToggle"
import "./App.css"

// Single source of truth for the two values Framer's Properties panel would
// otherwise control (Accent Color, Card Radius). Locally there's no
// Framer canvas to set them from, so they're plain constants shared by the
// hero (plain markup) and the courses section (the actual code component),
// which keeps the two visually consistent instead of guessing matching
// values in two places.
const ACCENT_COLOR = "#5B5FEF"
const CARD_RADIUS = 14

function App() {
    return (
        <>
            <ThemeToggle />

            <Routes>
                <Route path="/" element={<HomePage accentColor={ACCENT_COLOR} cornerRadius={CARD_RADIUS} />} />
                {/* Catch-all — matches any path that isn't "/" above. */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </>
    )
}

export default App
