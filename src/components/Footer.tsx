// Deliberately plain: connect + source links and a copyright line, no more.
export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-inner">
                <nav className="footer-links" aria-label="Footer">
                    <a href="https://darshandev.online" target="_blank" rel="noopener noreferrer">
                        🔗 Connect
                    </a>
                    <a
                        href="https://github.com/Darshan98Solanki/WebVeda-Assessment"
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Source code for this site"
                    >
                        🐙 GitHub
                    </a>
                </nav>
                <p className="footer-copyright">© 2026 All rights reserved by Darshan Solanki 🚀</p>
            </div>
        </footer>
    )
}
