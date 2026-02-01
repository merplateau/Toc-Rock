const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const fs = require('fs')

// 防止垃圾回收
let mainWindow = null

// 开发模式检测
const isDev = !app.isPackaged

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 700,
        titleBarStyle: 'hiddenInset',
        trafficLightPosition: { x: 20, y: 20 },
        vibrancy: 'under-window',
        visualEffectState: 'active',
        backgroundColor: '#00000000',
        transparent: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        }
    })

    // 加载应用
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173')
        mainWindow.webContents.openDevTools()
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
    }

    // 窗口关闭时清理
    mainWindow.on('closed', () => {
        mainWindow = null
    })
}

// 应用准备就绪
app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

// 所有窗口关闭时退出 (macOS 除外)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

// 退出前清理临时文件
app.on('before-quit', () => {
    // 清理临时目录
    const tempDir = path.join(app.getPath('temp'), 'toc-rock')
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true })
    }
})

// IPC: 保存文件对话框
ipcMain.handle('save-file', async (event, { data, filename, filters }) => {
    const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: filename,
        filters: filters || [{ name: 'PDF', extensions: ['pdf'] }]
    })

    if (!result.canceled && result.filePath) {
        const buffer = Buffer.from(data)
        fs.writeFileSync(result.filePath, buffer)
        return { success: true, path: result.filePath }
    }
    return { success: false }
})

// IPC: 打开文件对话框
ipcMain.handle('open-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [{ name: 'PDF', extensions: ['pdf'] }]
    })

    if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0]
        const data = fs.readFileSync(filePath)
        return {
            success: true,
            path: filePath,
            name: path.basename(filePath),
            data: data.buffer
        }
    }
    return { success: false }
})

// IPC: 在 Finder 中显示
ipcMain.handle('show-in-finder', async (event, filePath) => {
    shell.showItemInFolder(filePath)
})
