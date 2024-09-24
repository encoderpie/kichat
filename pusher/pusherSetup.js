import Pusher from 'pusher-js';
import { messageParser, eventParser } from '../utils/messageParser.js';

export function setupPusher(mainWindow) {
    const pusher = new Pusher('32cbd69e4b950bf97679', {
        cluster: 'us2',
        useTLS: true
    });

    const eventHandlers = {
        'App\\Events\\ChatMessageEvent': handleChatMessageEvent,
        'App\\Events\\MessageDeletedEvent': handleGenericEvent('message-deleted'),
        'App\\Events\\UserBannedEvent': handleGenericEvent('user-banned'),
        'App\\Events\\UserUnbannedEvent': handleGenericEvent('user-unbanned'),
        'App\\Events\\ChatroomClearEvent': handleGenericEvent('chatroom-cleared')
    };

    function handleChatMessageEvent(channel, chatroomId, data) {
        const parsedMessage = messageParser(channel, chatroomId, data);
        mainWindow.webContents.send('message', parsedMessage);
    }

    function handleGenericEvent(eventType) {
        return (channel, chatroomId, data) => {
            const parsedData = eventParser(channel, chatroomId, data);
            mainWindow.webContents.send(eventType, parsedData);
        };
    }

    return pusher;
}