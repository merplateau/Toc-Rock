import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePdf } from '../hooks/usePdf'
import { useSettings } from '../hooks/useSettings'
import { renderPagesToImages, writeTocToPdf, downloadBlob } from '../utils/pdfUtils'
import { buildTocPrompt, parseTocJson, tocItemsToJson } from '../utils/tocUtils'
import { callVisionModel } from '../utils/apiUtils'
import TocEditor from './TocEditor'
import './TocWizard.css'

const STEPS = [
    { id: 1, title: '选择目录页', icon: '📄' },
    { id: 2, title: '识别目录', icon: '🔍' },
    { id: 3, title: '设置偏移', icon: '⚙️' },
    { id: 4, title: '写入 PDF', icon: '✅' }
]

function TocWizard() {
    const { pdfFile, pdfDoc, fileName, totalPages, setStatus } = usePdf()
    const { apiConfig } = useSettings()

    const [currentStep, setCurrentStep] = useState(1)
    const [tocRange, setTocRange] = useState({ start: 1, end: 1 })
    const [tocItems, setTocItems] = useState([])
    const [offset, setOffset] = useState({ printed: 1, pdf: 1 })
    const [outputName, setOutputName] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [jsonText, setJsonText] = useState('')

    // 计算偏移量
    const offsetValue = offset.pdf - offset.printed

    // 下一步
    const nextStep = () => setCurrentStep(s => Math.min(4, s + 1))
    const prevStep = () => setCurrentStep(s => Math.max(1, s - 1))

    // Step 2: 识别目录
    const handleRecognize = useCallback(async () => {
        if (!pdfDoc || !apiConfig.apiKey) {
            setStatus('请先在设置中配置 API Key')
            return
        }

        setIsProcessing(true)
        setStatus('正在渲染目录页...')

        try {
            const images = await renderPagesToImages(pdfDoc, tocRange.start, tocRange.end)
            setStatus('正在调用 AI 识别...')

            const prompt = buildTocPrompt(tocRange.start, tocRange.end)
            const responseText = await callVisionModel({
                endpoint: apiConfig.endpoint,
                apiKey: apiConfig.apiKey,
                model: apiConfig.model,
                prompt,
                images
            })

            setJsonText(responseText)
            const parsed = parseTocJson(responseText)
            setTocItems(parsed.items)
            setStatus('识别完成')
            nextStep()
        } catch (err) {
            console.error(err)
            setStatus('识别失败: ' + err.message)
        } finally {
            setIsProcessing(false)
        }
    }, [pdfDoc, apiConfig, tocRange, setStatus])

    // 手动加载 JSON
    const handleLoadJson = useCallback(() => {
        try {
            const parsed = parseTocJson(jsonText)
            setTocItems(parsed.items)
            setStatus('JSON 已加载')
        } catch (err) {
            setStatus('JSON 解析失败: ' + err.message)
        }
    }, [jsonText, setStatus])

    // Step 4: 写入 PDF
    const handleWriteToc = useCallback(async () => {
        if (!pdfFile || !tocItems.length) return

        setIsProcessing(true)
        setStatus('正在写入目录...')

        try {
            const pdfBytes = await writeTocToPdf(pdfFile, tocItems, offsetValue)
            const filename = `${outputName || fileName + '-toc'}.pdf`
            downloadBlob(pdfBytes, filename)
            setStatus('目录写入完成，已下载')
        } catch (err) {
            console.error(err)
            setStatus('写入失败: ' + err.message)
        } finally {
            setIsProcessing(false)
        }
    }, [pdfFile, tocItems, offsetValue, outputName, fileName, setStatus])

    return (
        <motion.div
            className="toc-wizard glass-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {/* Step indicators */}
            <div className="wizard-steps">
                {STEPS.map((step) => (
                    <div
                        key={step.id}
                        className={`wizard-step ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}
                        onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                    >
                        <span className="step-icon">{step.icon}</span>
                        <span className="step-title">{step.title}</span>
                    </div>
                ))}
            </div>

            {/* Step content */}
            <div className="wizard-content">
                <AnimatePresence mode="wait">
                    {currentStep === 1 && (
                        <StepContent key="step1">
                            <h3>选择目录所在页码范围</h3>
                            <p className="step-desc">指定 PDF 中目录页的起始和结束位置</p>

                            <div className="step-inputs">
                                <div className="input-group">
                                    <label>起始页</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={totalPages}
                                        value={tocRange.start}
                                        onChange={(e) => setTocRange(prev => ({ ...prev, start: parseInt(e.target.value) || 1 }))}
                                    />
                                </div>
                                <span className="input-separator">至</span>
                                <div className="input-group">
                                    <label>结束页</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={totalPages}
                                        value={tocRange.end}
                                        onChange={(e) => setTocRange(prev => ({ ...prev, end: parseInt(e.target.value) || 1 }))}
                                    />
                                </div>
                            </div>

                            <div className="step-actions">
                                <button className="btn btn-primary" onClick={nextStep}>
                                    下一步
                                </button>
                            </div>
                        </StepContent>
                    )}

                    {currentStep === 2 && (
                        <StepContent key="step2">
                            <h3>识别目录内容</h3>
                            <p className="step-desc">使用 AI 自动识别，或手动输入 JSON</p>

                            <div className="recognize-actions">
                                <button
                                    className="btn btn-primary btn-lg"
                                    onClick={handleRecognize}
                                    disabled={isProcessing || !apiConfig.apiKey}
                                >
                                    {isProcessing ? '识别中...' : '🤖 AI 自动识别'}
                                </button>
                                {!apiConfig.apiKey && (
                                    <p className="warning-text">请先在设置中配置 API Key</p>
                                )}
                            </div>

                            <div className="divider">
                                <span>或手动输入</span>
                            </div>

                            <div className="json-input-area">
                                <textarea
                                    value={jsonText}
                                    onChange={(e) => setJsonText(e.target.value)}
                                    placeholder='{"items": [{"title": "第一章", "page": 1, "level": 1}]}'
                                    rows={6}
                                />
                                <button className="btn btn-secondary" onClick={handleLoadJson}>
                                    加载 JSON
                                </button>
                            </div>

                            <div className="step-actions">
                                <button className="btn btn-ghost" onClick={prevStep}>上一步</button>
                                <button
                                    className="btn btn-primary"
                                    onClick={nextStep}
                                    disabled={tocItems.length === 0}
                                >
                                    下一步 ({tocItems.length} 条目)
                                </button>
                            </div>
                        </StepContent>
                    )}

                    {currentStep === 3 && (
                        <StepContent key="step3">
                            <h3>设置页码偏移量</h3>
                            <p className="step-desc">将目录中的印刷页码转换为 PDF 实际页码</p>

                            <div className="offset-calculator">
                                <div className="offset-inputs">
                                    <div className="input-group">
                                        <label>印刷页码</label>
                                        <input
                                            type="number"
                                            min={1}
                                            value={offset.printed}
                                            onChange={(e) => setOffset(prev => ({ ...prev, printed: parseInt(e.target.value) || 1 }))}
                                        />
                                        <span className="input-hint">目录上标注的页码</span>
                                    </div>
                                    <div className="offset-equals">=</div>
                                    <div className="input-group">
                                        <label>PDF 页码</label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={totalPages}
                                            value={offset.pdf}
                                            onChange={(e) => setOffset(prev => ({ ...prev, pdf: parseInt(e.target.value) || 1 }))}
                                        />
                                        <span className="input-hint">PDF 中的实际页码</span>
                                    </div>
                                </div>

                                <div className="offset-result">
                                    <span className="offset-label">偏移量</span>
                                    <span className="offset-value">{offsetValue >= 0 ? '+' : ''}{offsetValue}</span>
                                </div>
                            </div>

                            <TocEditor items={tocItems} onChange={setTocItems} />

                            <div className="step-actions">
                                <button className="btn btn-ghost" onClick={prevStep}>上一步</button>
                                <button className="btn btn-primary" onClick={nextStep}>
                                    下一步
                                </button>
                            </div>
                        </StepContent>
                    )}

                    {currentStep === 4 && (
                        <StepContent key="step4">
                            <h3>导出 PDF</h3>
                            <p className="step-desc">将目录写入 PDF 文件并下载</p>

                            <div className="export-summary">
                                <div className="summary-item">
                                    <span className="summary-label">目录条目</span>
                                    <span className="summary-value">{tocItems.length} 条</span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-label">页码偏移</span>
                                    <span className="summary-value">{offsetValue >= 0 ? '+' : ''}{offsetValue}</span>
                                </div>
                            </div>

                            <div className="export-filename">
                                <label>输出文件名</label>
                                <div className="filename-input-group">
                                    <input
                                        type="text"
                                        value={outputName}
                                        onChange={(e) => setOutputName(e.target.value)}
                                        placeholder={fileName + '-toc'}
                                    />
                                    <span className="extension">.pdf</span>
                                </div>
                            </div>

                            <div className="step-actions">
                                <button className="btn btn-ghost" onClick={prevStep}>上一步</button>
                                <button
                                    className="btn btn-primary btn-lg"
                                    onClick={handleWriteToc}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? '处理中...' : '✨ 写入并下载'}
                                </button>
                            </div>
                        </StepContent>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    )
}

function StepContent({ children }) {
    return (
        <motion.div
            className="step-content"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
        >
            {children}
        </motion.div>
    )
}

export default TocWizard
