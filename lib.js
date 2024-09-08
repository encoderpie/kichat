import { runtimeChannelData } from './utils.js'

export const messageParser = (data) => {
  const chatroom_id = data.chatroom_id
  const channel_name = runtimeChannelData.get(chatroom_id)
  const badges = data.sender.identity.badges

  //console.log('MESSAGE RETURN', { ...data, channel_name, badges })
  return { ...data, channel_name, badges }
}

export const oldMessageParser = (data, channel_name) => {
  const badges = data.sender.identity.badges

  //console.log('MESSAGE RETURN', { ...data, channel_name, badges })
  return { ...data, channel_name, badges, type: 'old-message' }
}

export const messageDeletedParser = (rawData) => {
  const chatroom_id = parseInt(rawData.channel.split('.')[1])
  const channel_name = runtimeChannelData.get(chatroom_id)
  const message_data = JSON.parse(rawData.data)
  
  return { ...rawData, data: message_data, channel_name }
}

export const userBannedParser = (message) => {

}
// other message parsers...

export const logMessage = (data) => {
  console.log(`${data.channel_name} | ${data.sender.username}: ${data.content}`)
}