import { motion } from 'framer-motion'
import Sidebar from './Sidebar'
import './AppLayout.css'

function AppLayout({ children, currentPage, onNavigate }) {
    return (
        <div className="app-layout">
            {/* Titlebar - draggable area for window */}
            <div className="titlebar draggable-region">
                <div className="titlebar-spacer" />
                <span className="titlebar-title">Toc Rock</span>
                <div className="titlebar-spacer" />
            </div>

            {/* Main content area */}
            <div className="app-content">
                <Sidebar currentPage={currentPage} onNavigate={onNavigate} />

                <motion.main
                    className="main-content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                >
                    {children}
                </motion.main>
            </div>
        </div>
    )
}

export default AppLayout
