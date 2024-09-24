import { BrowserWindow, Menu } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export function createLoginWindow() {
    const loginWindow = new BrowserWindow({
        width: 600,
        height: 300,
        webPreferences: {
            preload: path.join(__dirname, '../preload.js'),
            nodeIntegration: true,
            contextIsolation: false
        },
        icon: path.join(__dirname, '../resources', 'kichat.ico')
    })

    loginWindow.loadFile(path.join(__dirname, '../login.html'))

    loginWindow.on('closed', () => {
        global.loginWindow = null
    })

    Menu.setApplicationMenu(null)

    return loginWindow
}

export function createMainWindow() {
    const mainWindow = new BrowserWindow({
        width: 700,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, '../preload.js'),
            nodeIntegration: true,
            contextIsolation: false
        },
        icon: path.join(__dirname, '../resources', 'kichat.ico')
    })

    mainWindow.loadURL(`http://localhost:53340`)

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url)
        return { action: 'deny' }
    })

    //Menu.setApplicationMenu(null)

    return mainWindow
}