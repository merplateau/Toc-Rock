import { motion } from 'framer-motion'
import { usePdf } from '../../hooks/usePdf'
import './Sidebar.css'

// SVG Icons
const Icons = {
    split: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="12" y1="3" x2="12" y2="21" />
        </svg>
    ),
    toc: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
    ),
    settings: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    ),
    close: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    )
}

function Sidebar({ currentPage, onNavigate }) {
    const { pdfDoc, unloadPdf, mode, setMode } = usePdf()
    const hasPdf = !!pdfDoc

    return (
        <aside className="sidebar glass">
            <nav className="sidebar-nav">
                {/* Mode buttons - only show when PDF is loaded */}
                {hasPdf && (
                    <div className="sidebar-section">
                        <SidebarButton
                            icon={Icons.split}
                            label="分割"
                            isActive={mode === 'split'}
                            onClick={() => setMode('split')}
                        />
                        <SidebarButton
                            icon={Icons.toc}
                            label="目录"
                            isActive={mode === 'toc'}
                            onClick={() => setMode('toc')}
                        />
                    </div>
                )}

                <div className="sidebar-spacer" />

                {/* Bottom section */}
                <div className="sidebar-section">
                    {hasPdf && (
                        <SidebarButton
                            icon={Icons.close}
                            label="关闭文件"
                            onClick={unloadPdf}
                            variant="danger"
                        />
                    )}
                    <SidebarButton
                        icon={Icons.settings}
                        label="设置"
                        isActive={currentPage === 'settings'}
                        onClick={() => onNavigate(currentPage === 'settings' ? 'home' : 'settings')}
                    />
                </div>
            </nav>
        </aside>
    )
}

function SidebarButton({ icon, label, isActive, onClick, variant }) {
    return (
        <motion.button
            className={`sidebar-btn ${isActive ? 'active' : ''} ${variant || ''}`}
            onClick={onClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={label}
        >
            <span className="sidebar-btn-icon">{icon}</span>
            <span className="sidebar-btn-label">{label}</span>
        </motion.button>
    )
}

export default Sidebar
