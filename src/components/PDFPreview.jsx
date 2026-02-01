import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { usePdf } from '../hooks/usePdf'
import './PDFPreview.css'

function PDFPreview() {
    const { pdfDoc, totalPages, pageRange, setPageRange, registerCanvas } = usePdf()
    const containerRef = useRef(null)
    const [renderedPages, setRenderedPages] = useState([])
    const [lastClickedPage, setLastClickedPage] = useState(null)

    // 渲染所有页面
    useEffect(() => {
        if (!pdfDoc) return

        const renderPages = async () => {
            const pages = []
            const scale = 0.5 // 预览缩放比例

            for (let i = 1; i <= totalPages; i++) {
                try {
                    const page = await pdfDoc.getPage(i)
                    const viewport = page.getViewport({ scale })
                    pages.push({
                        pageNum: i,
                        width: viewport.width,
                        height: viewport.height,
                        page,
                        viewport
                    })
                } catch (err) {
                    console.error(`渲染第 ${i} 页失败`, err)
                }
            }

            setRenderedPages(pages)
        }

        renderPages()

        return () => {
            setRenderedPages([])
        }
    }, [pdfDoc, totalPages])

    // 处理页面点击
    const handlePageClick = useCallback((pageNum, e) => {
        setLastClickedPage(pageNum)

        if (e.shiftKey) {
            // Shift + 点击设置结束页
            if (pageNum >= pageRange.start) {
                setPageRange(prev => ({ ...prev, end: pageNum }))
            }
        } else {
            // 普通点击设置开始页
            setPageRange(prev => ({
                start: pageNum,
                end: pageNum > prev.end ? totalPages : prev.end
            }))
        }
    }, [pageRange.start, setPageRange, totalPages])

    // 滚动到指定页面
    const scrollToPage = useCallback((pageNum) => {
        const container = containerRef.current
        if (!container) return

        const pageElement = container.querySelector(`[data-page="${pageNum}"]`)
        if (pageElement) {
            pageElement.scrollIntoView({ behavior: 'smooth', inline: 'center' })
        }
    }, [])

    if (!pdfDoc || renderedPages.length === 0) {
        return null
    }

    return (
        <div className="pdf-preview-wrapper">
            <div className="pdf-preview-header">
                <div className="pdf-preview-info">
                    <span className="pdf-preview-count">{totalPages} 页</span>
                    <span className="pdf-preview-hint">点击选择起始页，Shift+点击选择结束页</span>
                </div>
                <div className="pdf-preview-nav">
                    <button
                        className="btn btn-ghost btn-icon"
                        onClick={() => scrollToPage(1)}
                        title="跳转到开头"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="11 17 6 12 11 7" />
                            <polyline points="18 17 13 12 18 7" />
                        </svg>
                    </button>
                    <button
                        className="btn btn-ghost btn-icon"
                        onClick={() => scrollToPage(totalPages)}
                        title="跳转到结尾"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="13 17 18 12 13 7" />
                            <polyline points="6 17 11 12 6 7" />
                        </svg>
                    </button>
                </div>
            </div>

            <motion.div
                ref={containerRef}
                className="pdf-preview-container"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
            >
                {renderedPages.map(({ pageNum, width, height, page, viewport }) => (
                    <PageCanvas
                        key={pageNum}
                        pageNum={pageNum}
                        page={page}
                        viewport={viewport}
                        width={width}
                        height={height}
                        isInRange={pageNum >= pageRange.start && pageNum <= pageRange.end}
                        onClick={(e) => handlePageClick(pageNum, e)}
                        registerCanvas={registerCanvas}
                    />
                ))}
            </motion.div>
        </div>
    )
}

function PageCanvas({ pageNum, page, viewport, width, height, isInRange, onClick, registerCanvas }) {
    const canvasRef = useRef(null)
    const [isRendered, setIsRendered] = useState(false)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || !page || !viewport) return

        registerCanvas(canvas)

        const ctx = canvas.getContext('2d')
        canvas.width = viewport.width
        canvas.height = viewport.height

        const renderTask = page.render({
            canvasContext: ctx,
            viewport: viewport
        })

        renderTask.promise.then(() => {
            setIsRendered(true)
        }).catch(err => {
            console.error(`Canvas render error for page ${pageNum}:`, err)
        })

        return () => {
            renderTask.cancel()
        }
    }, [page, viewport, pageNum, registerCanvas])

    return (
        <motion.div
            className={`page-wrapper ${isInRange ? 'in-range' : ''}`}
            data-page={pageNum}
            onClick={onClick}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: Math.min(pageNum * 0.02, 0.5) }}
            whileHover={{ scale: isInRange ? 1.02 : 1.05 }}
            whileTap={{ scale: 0.98 }}
            title={`第 ${pageNum} 页`}
        >
            <canvas ref={canvasRef} className={isRendered ? 'rendered' : ''} />
            <div className="page-number">{pageNum}</div>
            {isInRange && <div className="page-check">✓</div>}
        </motion.div>
    )
}

export default PDFPreview
