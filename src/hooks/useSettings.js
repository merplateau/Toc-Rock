import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'toc-rock-settings'

const defaultSettings = {
    apiKey: '',
    theme: 'system', // 'light' | 'dark' | 'system'
}

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY)
            if (stored) {
                return { ...defaultSettings, ...JSON.parse(stored) }
            }
        } catch (e) {
            console.error('Failed to load settings:', e)
        }
        return defaultSettings
    })

    // 持久化设置
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
        } catch (e) {
            console.error('Failed to save settings:', e)
        }
    }, [settings])

    const updateSetting = useCallback((key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }))
    }, [])

    const resetSettings = useCallback(() => {
        setSettings(defaultSettings)
    }, [])

    // API 配置 (模型和地址是固定的)
    const apiConfig = {
        model: 'doubao-seed-1-6-flash-250828',
        endpoint: 'https://ark.cn-beijing.volces.com/api/v3/responses',
        apiKey: settings.apiKey
    }

    const value = {
        settings,
        updateSetting,
        resetSettings,
        apiConfig
    }

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    )
}

export function useSettings() {
    const context = useContext(SettingsContext)
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider')
    }
    return context
}
