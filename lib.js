import { runtimeChannelData } from './utils.js'

export const messageParser = (channel_name, chatroomId, data) => {
  console.log('MESSAGE PARSER DATA', data)
  const badges = data.sender.identity.badges

  return { ...data, channel_name, badges }
}

export const oldMessageParser = (data, channel_name) => {
  const badges = data.sender.identity.badges

  return { ...data, channel_name, badges, type: 'old-message' }
}

export const messageDeletedParser = (channel_name, chatroomId, data) => {
  console.log('MESSAGE DELETED DATA', data)
  
  return { ...data, channel_name }
}

export const userBannedParser = (channel_name, chatroomId, data) => {
  console.log('USER BANNED DATA', data)
  return { ...data, channel_name }
}

export const userUnbannedParser = (channel_name, chatroomId, data) => {
  console.log('USER UNBANNED DATA', data)
  return { ...data, channel_name }
}

// other message parsers...

export const logMessage = (data) => {
  console.log(`${data.channel_name} | ${data.sender.username}: ${data.content}`)
}