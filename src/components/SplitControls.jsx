import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { usePdf } from '../hooks/usePdf'
import { splitPdf, downloadBlob } from '../utils/pdfUtils'
import './SplitControls.css'

function SplitControls() {
    const { pdfFile, fileName, totalPages, pageRange, setPageRange, setStatus } = usePdf()
    const [outputName, setOutputName] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)

    const handleSplit = useCallback(async () => {
        if (!pdfFile) return

        const { start, end } = pageRange
        if (start > end || start < 1 || end > totalPages) {
            setStatus('请检查页码范围')
            return
        }

        setIsProcessing(true)
        setStatus('正在分割 PDF...')

        try {
            const pdfBytes = await splitPdf(pdfFile, start, end)
            const filename = `${outputName || fileName + '-split'}.pdf`
            downloadBlob(pdfBytes, filename)
            setStatus('分割完成，已下载')
        } catch (err) {
            console.error(err)
            setStatus('分割失败: ' + err.message)
        } finally {
            setIsProcessing(false)
        }
    }, [pdfFile, pageRange, totalPages, outputName, fileName, setStatus])

    const handleStartChange = (e) => {
        const value = Math.max(1, Math.min(totalPages, parseInt(e.target.value) || 1))
        setPageRange(prev => ({
            start: value,
            end: Math.max(value, prev.end)
        }))
    }

    const handleEndChange = (e) => {
        const value = Math.max(1, Math.min(totalPages, parseInt(e.target.value) || 1))
        setPageRange(prev => ({
            start: Math.min(value, prev.start),
            end: value
        }))
    }

    return (
        <motion.div
            className="split-controls glass-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="controls-row">
                <div className="control-group">
                    <label className="control-label">页码范围</label>
                    <div className="page-range-inputs">
                        <input
                            type="number"
                            min={1}
                            max={totalPages}
                            value={pageRange.start}
                            onChange={handleStartChange}
                            className="page-input"
                        />
                        <span className="range-separator">至</span>
                        <input
                            type="number"
                            min={1}
                            max={totalPages}
                            value={pageRange.end}
                            onChange={handleEndChange}
                            className="page-input"
                        />
                        <span className="page-total">/ {totalPages}</span>
                    </div>
                </div>

                <div className="control-group">
                    <label className="control-label">输出文件名</label>
                    <div className="filename-input-group">
                        <input
                            type="text"
                            value={outputName}
                            onChange={(e) => setOutputName(e.target.value)}
                            placeholder={fileName + '-split'}
                            className="filename-input"
                        />
                        <span className="extension">.pdf</span>
                    </div>
                </div>

                <button
                    className="btn btn-primary btn-lg split-btn"
                    onClick={handleSplit}
                    disabled={isProcessing}
                >
                    {isProcessing ? (
                        <>
                            <span className="btn-spinner" />
                            处理中...
                        </>
                    ) : (
                        <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            分割并下载
                        </>
                    )}
                </button>
            </div>

            <div className="selection-info">
                已选择 <strong>{pageRange.end - pageRange.start + 1}</strong> 页
                （第 {pageRange.start} 页 - 第 {pageRange.end} 页）
            </div>
        </motion.div>
    )
}

export default SplitControls
