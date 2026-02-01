import { useState, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import AppLayout from './components/layout/AppLayout'
import HomePage from './pages/HomePage'
import SettingsPage from './pages/SettingsPage'
import { SettingsProvider } from './hooks/useSettings'
import { PdfProvider } from './hooks/usePdf'

function App() {
    const [currentPage, setCurrentPage] = useState('home')

    const navigateTo = useCallback((page) => {
        setCurrentPage(page)
    }, [])

    return (
        <SettingsProvider>
            <PdfProvider>
                <AppLayout currentPage={currentPage} onNavigate={navigateTo}>
                    <AnimatePresence mode="wait">
                        {currentPage === 'home' && <HomePage key="home" />}
                        {currentPage === 'settings' && <SettingsPage key="settings" onBack={() => navigateTo('home')} />}
                    </AnimatePresence>
                </AppLayout>
            </PdfProvider>
        </SettingsProvider>
    )
}

export default App
