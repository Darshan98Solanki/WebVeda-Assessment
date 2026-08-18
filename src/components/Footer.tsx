const FOOTER_LINKS = [
    { label: "About", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Terms", href: "#" },
] as const

// Deliberately plain, per the brief: three links and a copyright line, no
// more. Real hrefs aren't needed for this assignment.
export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-inner">
                <nav className="footer-links" aria-label="Footer">
                    {FOOTER_LINKS.map((link) => (
                        <a key={link.label} href={link.href}>
                            {link.label}
                        </a>
                    ))}
                </nav>
                <p className="footer-copyright">© 2026 Skillpath. All rights reserved.</p>
            </div>
        </footer>
    )
}
