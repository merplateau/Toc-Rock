import { motion } from 'framer-motion'
import { usePdf } from '../hooks/usePdf'
import DropZone from '../components/DropZone'
import PDFPreview from '../components/PDFPreview'
import SplitControls from '../components/SplitControls'
import TocWizard from '../components/TocWizard'
import './HomePage.css'

function HomePage() {
    const { pdfDoc, mode, status } = usePdf()

    if (!pdfDoc) {
        return (
            <div className="home-page">
                <DropZone />
            </div>
        )
    }

    return (
        <motion.div
            className="home-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <PDFPreview />

            {mode === 'split' ? (
                <SplitControls />
            ) : (
                <TocWizard />
            )}

            {status && (
                <div className="status-bar">
                    <span className="status-text">{status}</span>
                </div>
            )}
        </motion.div>
    )
}

export default HomePage
