import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { usePdf } from '../hooks/usePdf'
import './DropZone.css'

function DropZone() {
    const { loadPdf, isLoading } = usePdf()
    const [isDragging, setIsDragging] = useState(false)

    const handleDragOver = useCallback((e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback((e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        const files = e.dataTransfer?.files
        if (files && files.length > 0) {
            const file = files[0]
            // 宽松的 PDF 类型检查
            if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                loadPdf(file)
            } else {
                alert('请选择 PDF 文件')
            }
        }
    }, [loadPdf])

    const handleClick = useCallback(() => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'application/pdf,.pdf' // 增加 .pdf 扩展名支持
        input.onchange = (e) => {
            const file = e.target.files?.[0]
            if (file) {
                loadPdf(file)
            }
        }
        input.click()
    }, [loadPdf])

    return (
        <motion.div
            className={`drop-zone ${isDragging ? 'dragging' : ''} ${isLoading ? 'loading' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
        >
            <div className="drop-zone-content">
                <div className="drop-zone-icon">
                    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="8" y="6" width="32" height="36" rx="3" />
                        <path d="M16 18h16M16 26h16M16 34h8" strokeLinecap="round" />
                        <path d="M24 12v-6m-4 3l4-3 4 3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>

                {isLoading ? (
                    <div className="drop-zone-loading">
                        <div className="loading-spinner" />
                        <span>正在加载...</span>
                    </div>
                ) : (
                    <>
                        <h2 className="drop-zone-title">拖放 PDF 文件到这里</h2>
                        <p className="drop-zone-subtitle">或点击选择文件</p>
                    </>
                )}
            </div>

            {isDragging && (
                <motion.div
                    className="drop-zone-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <span>松开以加载文件</span>
                </motion.div>
            )}
        </motion.div>
    )
}

export default DropZone
