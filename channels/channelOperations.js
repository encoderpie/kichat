import {
  getChatroomId,
  getChannelData,
  getChannelEmotes,
  getChannel7TVEmotes,
  getOldMessagesOfChannel,
} from '../utils/channelUtils.js'
import {
  oldMessageParser,
  messageParser,
  eventParser,
} from '../utils/messageParser.js'
import axios from 'axios'
import Store from 'electron-store'

const store = new Store()

// Sabit değerler (normalde config.js'de olacak)
const API_BASE_URL = 'https://kick.com/api/v2'
const KICK_BASE_URL = 'https://kick.com'

/**
 * Olay işleyicileri için nesne
 */
const eventHandlers = {
  'App\\Events\\ChatMessageEvent': handleChatMessageEvent,
  'App\\Events\\MessageDeletedEvent': handleGenericEvent('message-deleted'),
  'App\\Events\\UserBannedEvent': handleGenericEvent('user-banned'),
  'App\\Events\\UserUnbannedEvent': handleGenericEvent('user-unbanned'),
  'App\\Events\\ChatroomClearEvent': handleGenericEvent('chatroom-cleared'),
  'App\\Events\\SubscriptionEvent': handleGenericEvent('subscription-event'),
}

/**
 * Sohbet mesajı olayını işler
 * @param {string} channel - Kanal adı
 * @param {string} chatroomId - Sohbet odası ID'si
 * @param {Object} data - Olay verisi
 * @param {BrowserWindow} mainWindow - Ana pencere
 */
function handleChatMessageEvent(channel, chatroomId, data, mainWindow) {
  const parsedMessage = messageParser(channel, chatroomId, data)
  mainWindow.webContents.send('message', parsedMessage)
}

/**
 * Genel olayları işlemek için bir fonksiyon oluşturur
 * @param {string} eventType - Olay türü
 * @returns {Function} Olay işleyici fonksiyonu
 */
function handleGenericEvent(eventType) {
  return (channel, chatroomId, data, mainWindow) => {
    const parsedData = eventParser(channel, chatroomId, data)
    mainWindow.webContents.send(eventType, parsedData)
  }
}

/**
 * Birden çok kanala bağlanır
 * @param {Array} channels - Kanal ve sohbet odası ID çiftlerinin dizisi
 * @param {BrowserWindow} mainWindow - Ana Electron penceresi
 * @param {Map} activeChannels - Aktif kanal bağlantılarını saklamak için bir Map
 * @param {Pusher} pusher - Pusher örneği
 */
export async function connectToChannels(
  channels,
  mainWindow,
  activeChannels,
  pusher
) {
  if (!pusher) {
    console.error('Pusher object is undefined')
    return
  }

  for (const [channel, chatroomId] of channels) {
    if (activeChannels.has(chatroomId)) {
      console.log(`Already connected to channel #${channel} (${chatroomId})`)
      continue
    }

    try {
      await connectSingleChannel(
        channel,
        chatroomId,
        mainWindow,
        activeChannels,
        pusher
      )
    } catch (error) {
      handleConnectionError(channel, error, mainWindow)
    }
  }
}

/**
 * Tek bir kanala bağlanır
 * @param {string} channel - Kanal adı
 * @param {string} chatroomId - Sohbet odası ID'si
 * @param {BrowserWindow} mainWindow - Ana Electron penceresi
 * @param {Map} activeChannels - Aktif kanal bağlantılarını saklamak için bir Map
 * @param {Pusher} pusher - Pusher örneği
 */
async function connectSingleChannel(
  channel,
  chatroomId,
  mainWindow,
  activeChannels,
  pusher
) {
  const channelData = await fetchChannelData(channel)
  sendConnectionStatus(mainWindow, channel, 'connecting', channelData)

  const oldMessages = await fetchOldMessages(channelData.id)
  sendOldMessages(oldMessages, channel, mainWindow)

  const pusherChannel = subscribeToPusherChannel(pusher, chatroomId, channel)
  bindPusherEvents(pusherChannel, channel, chatroomId, mainWindow)

  console.log(`Connected to #${channel} (${chatroomId})`)
  activeChannels.set(chatroomId, { pusherChannel, channelName: channel })
  sendConnectionStatus(mainWindow, channel, 'connected')
}

/**
 * Kanal verilerini getirir
 * @param {string} channel - Kanal adı
 * @returns {Promise<Object>} Kanal verileri
 */
async function fetchChannelData(channel) {
  let channelData = await getChannelData(channel)
  const channelEmotes = await getChannelEmotes(channel)
  const channel7TVEmotes = await getChannel7TVEmotes(channelData.user_id)
  channelData.chatroom.emotes = channelEmotes
  channelData.chatroom.emotes7tv = channel7TVEmotes
  return channelData
}

/**
 * Eski mesajları getirir
 * @param {string} channelId - Kanal ID'si
 * @returns {Promise<Array>} Sıralanmış eski mesajlar
 */
async function fetchOldMessages(channelId) {
  const getOldMessages = await getOldMessagesOfChannel(channelId)
  return getOldMessages.data.messages.sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  )
}

/**
 * Eski mesajları gönderir
 * @param {Array} messages - Mesajlar dizisi
 * @param {string} channel - Kanal adı
 * @param {BrowserWindow} mainWindow - Ana Electron penceresi
 */
function sendOldMessages(messages, channel, mainWindow) {
  messages.forEach((message) => {
    const parsedMessage = oldMessageParser(message, channel)
    console.log(message, parsedMessage)
    mainWindow.webContents.send('message', parsedMessage)
  })
}

/**
 * Pusher kanalına abone olur
 * @param {Pusher} pusher - Pusher örneği
 * @param {string} chatroomId - Sohbet odası ID'si
 * @param {string} channel - Kanal adı
 * @returns {PusherChannel} Pusher kanal örneği
 */
function subscribeToPusherChannel(pusher, chatroomId, channel) {
  const pusherChannelName = `chatrooms.${chatroomId}.v2`

  if (pusher.channel(pusherChannelName)) {
    pusher.unsubscribe(pusherChannelName)
  }

  const pusherChannel = pusher.subscribe(pusherChannelName)

  pusherChannel.bind('pusher:subscription_succeeded', () => {
    console.log(`Successfully subscribed to #${channel} (${chatroomId})`)
  })

  return pusherChannel
}

/**
 * Pusher olaylarını bağlar
 * @param {PusherChannel} pusherChannel - Pusher kanal örneği
 * @param {string} channel - Kanal adı
 * @param {string} chatroomId - Sohbet odası ID'si
 * @param {BrowserWindow} mainWindow - Ana Electron penceresi
 */
function bindPusherEvents(pusherChannel, channel, chatroomId, mainWindow) {
  pusherChannel.bind_global((eventName, data) => {
    console.log('Event Name:', eventName)
    console.log('Event Data:', data)

    if (eventName === 'pusher:subscription_succeeded') {
      return
    }

    const handler = eventHandlers[eventName]
    if (handler) {
      handler(channel, chatroomId, data, mainWindow)
    } else {
      console.log(`Unknown event: ${eventName}`)
    }
  })
}

/**
 * Bağlantı hatasını işler
 * @param {string} channel - Kanal adı
 * @param {Error} error - Hata nesnesi
 * @param {BrowserWindow} mainWindow - Ana Electron penceresi
 */
function handleConnectionError(channel, error, mainWindow) {
  console.error(`Error connecting to channel #${channel}:`, error)
  mainWindow.webContents.send('server-message', {
    channel,
    status: 'error',
    error: error.message,
  })
}

/**
 * Bağlantı durumunu gönderir
 * @param {BrowserWindow} mainWindow - Ana Electron penceresi
 * @param {string} channel - Kanal adı
 * @param {string} status - Bağlantı durumu
 * @param {Object} [channelData] - Kanal verileri (isteğe bağlı)
 */
function sendConnectionStatus(mainWindow, channel, status, channelData = null) {
  mainWindow.webContents.send('server-message', {
    channel,
    status,
    channelData,
  })
}

/**
 * Bir kanaldan bağlantıyı keser
 * @param {string} channel - Kanal adı
 * @param {Map} activeChannels - Aktif kanal bağlantılarını saklamak için bir Map
 * @param {Pusher} pusher - Pusher örneği
 */
export async function disconnectFromChannel(channel, activeChannels, pusher) {
  const chatroomId = await getChatroomId([channel])
  if (chatroomId[0]) {
    const channelData = activeChannels.get(chatroomId[0])
    if (channelData) {
      const { pusherChannel, channelName } = channelData
      const pusherChannelName = `chatrooms.${chatroomId[0]}.v2`

      pusher.unsubscribe(pusherChannelName)
      pusherChannel.unbind_all()

      console.log(
        `Disconnected from channel #${channelName} (${chatroomId[0]})`
      )
      activeChannels.delete(chatroomId[0])
    } else {
      console.log(`Socket for channel ${channel} not found`)
    }
  } else {
    console.log(`Channel ID for ${channel} not found`)
  }
}

/**
 * Bir kanala mesaj gönderir
 * @param {string} messageContent - Mesaj içeriği
 * @param {Object} channelData - Kanal verileri
 */
export async function sendMessageToChannel(messageContent, channelData) {
  const user_cookies = store.get('cookies')
  const user_session_token = store.get('session_token')
  if (channelData?.id) {
    try {
      const axiosRequest = await axios.post(
        `${API_BASE_URL}/messages/send/${channelData.chatroom.id}`,
        {
          content: messageContent,
          type: 'message',
        },
        {
          headers: {
            accept: 'application/json, text/plain, */*',
            authorization: `Bearer ${user_session_token}`,
            'content-type': 'application/json',
            'x-xsrf-token': user_session_token,
            cookie: user_cookies,
            Referer: `${KICK_BASE_URL}/${channelData.slug}`,
          },
        }
      )
      if (axiosRequest.status === 200) {
        console.log(
          `Message sent successfully -> ${channelData.slug}: ${messageContent}`
        )
      } else {
        console.log(
          `An error occurred while sending the message -> status_code: ${axiosRequest.status} - ${axiosRequest.statusText} CHANNEL: ${channelData.slug} MESSAGE: ${messageContent}`
        )
      }
    } catch (error) {
      console.error(`Error sending message to ${channelData.slug}:`, error)
    }
  } else {
    console.log(`Channel ID for ${channelData.slug} not found`)
  }
}
