import { app, BrowserWindow, ipcMain, Menu, shell, session } from 'electron'
import path from 'path'
import express from 'express'
import Pusher from 'pusher-js'
import Store from 'electron-store'
import { fileURLToPath } from 'url'
import bodyParser from 'body-parser'
import cors from 'cors'
import axios from 'axios'
import { messageParser, messageDeletedParser, oldMessageParser } from './lib.js'
import { getChatroomId, getChannelData, getChannelEmotes, getChannel7TVEmotes, getOldMessagesOfChannel } from './utils.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const store = new Store()
const expressApp = express()
const port = 53340

expressApp.use(bodyParser.json())
expressApp.use(cors())

expressApp.use(express.static(path.join(__dirname, 'public')))

function getSessionToken(cookieString) {
    const cookies = cookieString.split('; ')
    for (let cookie of cookies) {
        if (cookie.startsWith('session_token=')) {
            return decodeURIComponent(cookie.split('=')[1])
        }
    }
    return null // Return null if session_token is not found
}

expressApp.post('/login/cookies', (req, res) => {
    console.log('LOGIN Received cookies:', req.body)
    const { cookies } = req.body
    const session_token = getSessionToken(cookies)
    console.log('Received cookies:', cookies, 'and session token:', session_token)

    if (cookies && session_token) {
        store.set("cookies", cookies)
        store.set("session_token", session_token)
        res.send("Your Kick account has been successfully connected to Kichat. You can now open Kichat.")
        console.log("Cookies stored.", cookies, session_token)
        if (mainWindow) {
          app.relaunch()
          app.exit()
        } else if (loginWindow) {
          loginWindow.close()
          createMainWindow()
        }
    } else {
        res.status(400).send("No cookies provided.")
        console.log("No cookies provided.")
    }
})

const server = expressApp.listen(port, () => {
    console.log(`Express app listening at http://localhost:${port}`)
})

let mainWindow
let loginWindow

const createLoginWindow = () => {
    loginWindow = new BrowserWindow({
        width: 600,
        height: 300,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false
        },
        icon: path.join(__dirname, 'resources', 'kichat.ico')
    })

    loginWindow.loadFile('login.html')

    loginWindow.on('closed', () => {
        loginWindow = null
    })

    Menu.setApplicationMenu(null)
}

const createMainWindow = () => {
    mainWindow = new BrowserWindow({
        width: 700,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false
        },
        icon: path.join(__dirname, 'resources', 'kichat.ico')
    })

    mainWindow.loadURL(`http://localhost:${port}`)

    ipcMain.on('connect-channels', async (event, channels) => {
        const newChannels = channels.filter(channel => !Array.from(activeChannels.values()).some(ch => ch.channelName === channel))
        if (newChannels.length > 0) {
            const chatroomIds = await getChatroomId(newChannels)
            const channelPairs = newChannels.map((channel, index) => [channel, chatroomIds[index]])
            connectToChannels(channelPairs)
        } else {
            console.log('All channels are already connected.')
        }
    })

    ipcMain.on('disconnect-channel', (event, channel) => {
        disconnectFromChannel(channel)
    })

    ipcMain.on('send-message', async (event, { message, channelData }) => {
        console.log('IPC SEND MESSAGE:', message) //, channelData)
        await sendMessageToChannel(message, channelData)
    })

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url)
        return { action: 'deny' }
    })

    Menu.setApplicationMenu(null)
}

app.disableHardwareAcceleration()
app.whenReady().then(() => {
    /*  user rights :) */
    const user_cookies = store.get('cookies')
    const user_session_token = store.get('session_token')
    console.log('User Session Token:', user_session_token)
    console.log('User Cookies:', user_cookies)
    
    const cookies = store.get('cookies')
    if (!cookies) {
        createLoginWindow()
    } else {
        createMainWindow()
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            const cookies = store.get('cookies')
            if (!cookies) {
                createLoginWindow()
            } else {
                createMainWindow()
            }
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('close', () => {
    mainWindow = null
})

app.on('closed', () => {
    mainWindow = null
})

// Pusher
const pusher = new Pusher('32cbd69e4b950bf97679', {
    cluster: 'us2',
    useTLS: true
})

let activeChannels = new Map()

const connectToChannels = async (channels) => {
    for (const [channel, chatroomId] of channels) {
        if (activeChannels.has(chatroomId)) {
            console.log(`Already connected to channel #${channel} (${chatroomId})`)
        } else {
            let channelData = await getChannelData(channel)
            const channelEmotes = await getChannelEmotes(channel)
            const channel7TVEmotes = await getChannel7TVEmotes(channelData.user_id)
            const getOldMessages = await getOldMessagesOfChannel(channelData.id)
            //console.log('notparsed data',channelData,channelEmotes)
            channelData.chatroom.emotes = channelEmotes
            channelData.chatroom.emotes7tv = channel7TVEmotes
            //console.log('parsed data',channelData)
            mainWindow.webContents.send('server-message', { channel, status: 'connecting', channelData })

            console.log(getOldMessages)
            // sort messages by date
            const sortedMessages = getOldMessages.data.messages.sort((a, b) => {
              return new Date(a.created_at) - new Date(b.created_at)
            })
            
            // send sorted messages
            sortedMessages.forEach(message => {
              const parsedMessage = oldMessageParser(message, channel)
              console.log(message, parsedMessage)
              mainWindow.webContents.send('message', parsedMessage)
            })

            mainWindow.webContents.send('server-message', { channel, status: 'connected' })

            // Pusher kanalına abone ol
            const pusherChannel = pusher.subscribe(`chatrooms.${chatroomId}.v2`)
            
            // Eventleri dinle
            pusherChannel.bind_global((eventName, data) => {
                console.log('Event Name:', eventName)
                console.log('Event Data:', data)

                if (eventName === 'App\\Events\\ChatMessageEvent') {
                    const parsedMessage = messageParser(data)
                    mainWindow.webContents.send('message', parsedMessage)
                } else if (eventName === 'App\\Events\\MessageDeletedEvent') {
                    const parsedData = messageDeletedParser(data)
                    mainWindow.webContents.send('message-deleted', parsedData)
                }
            })

            console.log(`Connected to #${channel} (${chatroomId})`)
            activeChannels.set(chatroomId, { pusherChannel, channelName: channel })
        }
    }
}


const disconnectFromChannel = async (channel) => {
    const chatroomId = await getChatroomId([channel])
    if (chatroomId[0]) {
        const channelData = activeChannels.get(chatroomId[0])
        if (channelData) {
            const { pusherChannel, channelName } = channelData
            pusherChannel.unsubscribe()
            console.log(`Disconnected from channel #${channelName} (${chatroomId[0]})`)
            activeChannels.delete(chatroomId[0])
        } else {
            console.log(`Socket for channel ${channel} not found`)
        }
    } else {
        console.log(`Channel ID for ${channel} not found`)
    }
}

const sendMessageToChannel = async (messageContent, channelData) => {
    const user_cookies = store.get('cookies')
    const user_session_token = store.get('session_token')
    /* console.log('User Session Token:', user_session_token)
    console.log('User Cookies:', user_cookies)
    console.log('Channel ID:', channelData?.id)
    console.log('Message Content:', messageContent) */
    if (channelData?.id) {
        const axiosRequest = await axios.post(
            `https://kick.com/api/v2/messages/send/${channelData.chatroom.id}`,
            {
                content: messageContent,
                type: "message",
            },
            {
            headers: {
                accept: "application/json, text/plain, */*",
                authorization: `Bearer ${user_session_token}`,
                "content-type": "application/json",
                "x-xsrf-token": user_session_token,
                cookie: user_cookies,
                Referer: `https://kick.com/${channelData.slug}`,
            },
            }
        )
        //console.log(axiosRequest, axiosRequest?.data)
        if (axiosRequest.status === 200) {
            console.log(`Message sent successfully -> ${channelData.slug}: ${messageContent}`)
        } else {
            console.log(`An error occurred while sending the message -> status_code: ${axiosRequest.status} - ${axiosRequest.statusText} CHANNEL: ${channelData.slug} MESSAGE: ${messageContent}`)
        }
    } else {
        console.log(`Channel ID for ${channelData.slug} not found`)
    }
}