import { getChatroomId } from '../utils/channelUtils.js';
import Store from 'electron-store';

const store = new Store();

export function setupIpcHandlers(ipcMain, mainWindow, connectToChannels, disconnectFromChannel, sendMessageToChannel, pusher) {
    if (!global.activeChannels) {
        global.activeChannels = new Map();
    }

    ipcMain.on('app-closing', handleAppClosing(disconnectFromChannel, pusher));
    ipcMain.on('connect-channels', handleConnectChannels(connectToChannels, disconnectFromChannel, mainWindow, pusher));
    ipcMain.on('disconnect-channel', handleDisconnectChannel(disconnectFromChannel, pusher));
    ipcMain.on('send-message', handleSendMessage(sendMessageToChannel, pusher));
    setupChannelManagement(ipcMain, store);
}

function handleAppClosing(disconnectFromChannel, pusher) {
    return async (event) => {
        try {
            await disconnectAllChannels(disconnectFromChannel, pusher);
            event.reply('app-closed');
        } catch (error) {
            console.error('Error during app closing:', error);
            event.reply('app-close-error', error.message);
        }
    };
}

async function disconnectAllChannels(disconnectFromChannel, pusher) {
    for (let [channel, _] of global.activeChannels) {
        await disconnectFromChannel(channel, global.activeChannels, pusher);
    }
}

function handleConnectChannels(connectToChannels, disconnectFromChannel, mainWindow, pusher) {
    return async (event, channels) => {
        try {
            const { reconnectChannels, newChannels } = categorizeChannels(channels);
            await disconnectReconnectChannels(reconnectChannels, disconnectFromChannel, pusher);
            await connectAllChannels([...reconnectChannels, ...newChannels], connectToChannels, mainWindow, pusher);
        } catch (error) {
            console.error('Error in connect-channels:', error);
            event.reply('connect-channels-error', error.message);
        }
    };
}

function categorizeChannels(channels) {
    const reconnectChannels = [];
    const newChannels = [];
    for (const channel of channels) {
        if (Array.from(global.activeChannels.values()).some(ch => ch.channelName === channel)) {
            reconnectChannels.push(channel);
        } else {
            newChannels.push(channel);
        }
    }
    return { reconnectChannels, newChannels };
}

async function disconnectReconnectChannels(reconnectChannels, disconnectFromChannel, pusher) {
    for (const channel of reconnectChannels) {
        await disconnectFromChannel(channel, global.activeChannels, pusher);
    }
}

async function connectAllChannels(allChannels, connectToChannels, mainWindow, pusher) {
    if (allChannels.length > 0) {
        const chatroomIds = await getChatroomId(allChannels);
        const channelPairs = allChannels.map((channel, index) => [channel, chatroomIds[index]]);
        await connectToChannels(channelPairs, mainWindow, global.activeChannels, pusher);
    } else {
        console.log('No channels to connect.');
    }
}

function handleDisconnectChannel(disconnectFromChannel, pusher) {
    return async (event, channel) => {
        try {
            const channelEntry = Array.from(global.activeChannels.entries()).find(([_, value]) => value.channelName === channel);
            if (channelEntry) {
                await disconnectFromChannel(channel, global.activeChannels, pusher);
            } else {
                console.log(`Channel ${channel} is not active.`);
            }
        } catch (error) {
            console.error('Error in disconnect-channel:', error);
            event.reply('disconnect-channel-error', error.message);
        }
    };
}

function handleSendMessage(sendMessageToChannel, pusher) {
    return async (event, { message, channelData }) => {
        try {
            if (pusher.connection.state === 'connected') {
                console.log('IPC SEND MESSAGE:', message);
                await sendMessageToChannel(message, channelData);
            } else {
                throw new Error('Pusher connection is not established.');
            }
        } catch (error) {
            console.error('Error in send-message:', error);
            event.reply('send-message-error', error.message);
        }
    };
}

function setupChannelManagement(ipcMain, store) {
    ipcMain.on('load-channels', (event) => {
        const channels = store.get('channels', []);
        event.reply('channels-loaded', channels);
    });

    ipcMain.on('save-channel', (event, channel) => {
        let channels = store.get('channels', []);
        if (!channels.includes(channel)) {
            channels.push(channel);
            store.set('channels', channels);
        }
    });

    ipcMain.on('remove-channel', (event, channel) => {
        let channels = store.get('channels', []);
        channels = channels.filter(ch => ch !== channel);
        store.set('channels', channels);
    });
}