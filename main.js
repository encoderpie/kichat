import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import Store from 'electron-store';
import { setupExpressServer } from './server/expressServer.js';
import { createLoginWindow, createMainWindow } from './windows/windowCreation.js';
import { setupIpcHandlers } from './ipc/ipcHandlers.js';
import { connectToChannels, disconnectFromChannel, sendMessageToChannel } from './channels/channelOperations.js';
import { setupPusher } from './pusher/pusherSetup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const store = new Store();

let mainWindow;
let loginWindow;
let isQuitting = false;

const server = setupExpressServer(store, app, createMainWindow, loginWindow);

app.disableHardwareAcceleration();

setupErrorHandling();

app.whenReady().then(initializeApp);

app.on('activate', handleActivate);
app.on('before-quit', handleBeforeQuit);
app.on('window-all-closed', handleWindowAllClosed);
app.on('will-quit', handleWillQuit);

ipcMain.on('app-closed', () => app.exit(0));

function setupErrorHandling() {
    process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:', error);
        if (!isQuitting) {
            app.quit();
        }
    });
}

function initializeApp() {
    const cookies = store.get('cookies');
    if (!cookies) {
        loginWindow = createLoginWindow();
    } else {
        mainWindow = createMainWindow();
    }

    const pusher = setupPusher(mainWindow);
    setupIpcHandlers(ipcMain, mainWindow, connectToChannels, disconnectFromChannel, sendMessageToChannel, pusher);
}

function handleActivate() {
    if (BrowserWindow.getAllWindows().length === 0) {
        const cookies = store.get('cookies');
        if (!cookies) {
            loginWindow = createLoginWindow();
        } else {
            mainWindow = createMainWindow();
        }
    }
}

function handleBeforeQuit(event) {
    if (!isQuitting) {
        event.preventDefault();
        isQuitting = true;
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('app-closing');
        } else {
            app.quit();
        }
    }
}

function handleWindowAllClosed() {
    if (process.platform !== 'darwin') {
        app.quit();
    }
}

function handleWillQuit() {
    if (server) {
        server.close();
    }
}