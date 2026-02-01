const { contextBridge, ipcRenderer } = require('electron')

// 安全地暴露 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
    // 保存文件
    saveFile: (data, filename, filters) =>
        ipcRenderer.invoke('save-file', { data, filename, filters }),

    // 打开文件
    openFile: () =>
        ipcRenderer.invoke('open-file'),

    // 在 Finder 中显示
    showInFinder: (filePath) =>
        ipcRenderer.invoke('show-in-finder', filePath),

    // 平台检测
    platform: process.platform,

    // 是否为 Electron 环境
    isElectron: true
})

// 防止拖拽文件时页面跳转
window.addEventListener('dragover', (e) => {
    e.preventDefault()
})

window.addEventListener('drop', (e) => {
    e.preventDefault()
})
