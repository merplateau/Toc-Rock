import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

// 设置 PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

const PdfContext = createContext(null)

export function PdfProvider({ children }) {
    const [pdfFile, setPdfFile] = useState(null)
    const [pdfDoc, setPdfDoc] = useState(null)
    const [fileName, setFileName] = useState('')
    const [totalPages, setTotalPages] = useState(0)
    const [pageRange, setPageRange] = useState({ start: 1, end: 1 })
    const [mode, setMode] = useState('split') // 'split' | 'toc'
    const [status, setStatus] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    // 保存 canvas 引用以便清理
    const canvasRefs = useRef([])

    // 加载 PDF
    const loadPdf = useCallback(async (file) => {
        if (!file) return

        // 先卸载现有的
        if (pdfDoc) {
            pdfDoc.destroy()
        }

        setIsLoading(true)
        setStatus('正在加载文件...')

        try {
            const arrayBuffer = await file.arrayBuffer()
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
            const doc = await loadingTask.promise

            setPdfFile(file)
            setPdfDoc(doc)
            setFileName(file.name.replace(/\.pdf$/i, ''))
            setTotalPages(doc.numPages)
            setPageRange({ start: 1, end: doc.numPages })
            setMode('split')
            setStatus(`已加载 ${doc.numPages} 页`)
            setIsLoading(false)

            return doc
        } catch (error) {
            console.error('PDF 加载失败:', error)
            setStatus('加载失败: ' + error.message)
            setIsLoading(false)
            throw error
        }
    }, [pdfDoc])

    // 卸载 PDF 并清理内存
    const unloadPdf = useCallback(() => {
        // 销毁 PDF.js 文档
        if (pdfDoc) {
            pdfDoc.destroy()
        }

        // 清理 canvas
        canvasRefs.current.forEach(canvas => {
            if (canvas) {
                const ctx = canvas.getContext('2d')
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height)
                }
                canvas.width = 0
                canvas.height = 0
            }
        })
        canvasRefs.current = []

        // 重置状态
        setPdfFile(null)
        setPdfDoc(null)
        setFileName('')
        setTotalPages(0)
        setPageRange({ start: 1, end: 1 })
        setMode('split')
        setStatus('文件已关闭')

        console.log('PDF 资源已清理')
    }, [pdfDoc])

    // 注册 canvas 引用
    const registerCanvas = useCallback((canvas) => {
        if (canvas && !canvasRefs.current.includes(canvas)) {
            canvasRefs.current.push(canvas)
        }
    }, [])

    // 组件卸载时清理
    useEffect(() => {
        return () => {
            if (pdfDoc) {
                pdfDoc.destroy()
            }
        }
    }, [])

    const value = {
        pdfFile,
        pdfDoc,
        fileName,
        totalPages,
        pageRange,
        setPageRange,
        mode,
        setMode,
        status,
        setStatus,
        isLoading,
        loadPdf,
        unloadPdf,
        registerCanvas
    }

    return (
        <PdfContext.Provider value={value}>
            {children}
        </PdfContext.Provider>
    )
}

export function usePdf() {
    const context = useContext(PdfContext)
    if (!context) {
        throw new Error('usePdf must be used within a PdfProvider')
    }
    return context
}
