import { motion } from 'framer-motion'
import { useSettings } from '../hooks/useSettings'
import './SettingsPage.css'

function SettingsPage({ onBack }) {
    const { settings, updateSetting, apiConfig } = useSettings()

    return (
        <motion.div
            className="settings-page"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
        >
            <div className="settings-header">
                <button className="btn btn-ghost" onClick={onBack}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                    返回
                </button>
                <h1>设置</h1>
            </div>

            <div className="settings-content">
                {/* API Configuration */}
                <section className="settings-section glass-card">
                    <h2>API 配置</h2>
                    <p className="section-desc">配置 AI 目录识别所需的 API 密钥</p>

                    <div className="setting-item">
                        <label htmlFor="apiKey">API Key</label>
                        <input
                            id="apiKey"
                            type="password"
                            value={settings.apiKey}
                            onChange={(e) => updateSetting('apiKey', e.target.value)}
                            placeholder="输入你的 API Key"
                            className="setting-input"
                        />
                        <span className="setting-hint">
                            API Key 仅保存在本地，不会上传到任何服务器
                        </span>
                    </div>

                    <div className="setting-item readonly">
                        <label>模型</label>
                        <div className="setting-value">{apiConfig.model}</div>
                    </div>

                    <div className="setting-item readonly">
                        <label>API 地址</label>
                        <div className="setting-value setting-value-url">{apiConfig.endpoint}</div>
                    </div>
                </section>

                {/* About */}
                <section className="settings-section glass-card">
                    <h2>关于</h2>

                    <div className="about-info">
                        <div className="app-icon">📄</div>
                        <div className="app-details">
                            <h3>Toc Rock</h3>
                            <p>PDF 分割与目录工具</p>
                            <p className="version">版本 1.0.0</p>
                        </div>
                    </div>

                    <div className="about-features">
                        <h4>功能特性</h4>
                        <ul>
                            <li>🔪 PDF 页面分割导出</li>
                            <li>📑 AI 智能目录识别</li>
                            <li>✏️ 目录手动编辑与调整</li>
                            <li>📥 PDF 目录写入与导出</li>
                        </ul>
                    </div>

                    <p className="about-footer">
                        所有操作均在本地完成，文件不会上传到任何服务器。
                    </p>
                </section>
            </div>
        </motion.div>
    )
}

export default SettingsPage
