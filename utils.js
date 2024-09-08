import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'

export const runtimeChannelData = new Map()

export const getChannel7TVEmotes = async (channelId) => {
  const response = await fetch(`https://7tv.io/v3/users/kick/${channelId}`)
  const data = await response.json()
  return data
}

export const getOldMessagesOfChannel = async (channelId) => {
  const puppeteerExtra = puppeteer.use(StealthPlugin())
  const browser = await puppeteerExtra.launch({ headless: "new" })
  const page = await browser.newPage()
  await page.goto(`https://kick.com/api/v2/channels/${channelId}/messages`)
  await page.waitForSelector("body")

  try {
    const emotesContent = await page.evaluate(() => {
      const bodyElement = document.querySelector("body")
      const bodyText = bodyElement ? bodyElement.textContent : null
      return bodyText ? JSON.parse(bodyText) : null
    })
    await browser.close()
    return emotesContent
  } catch (err) {
    await browser.close()
    throw err
  }
}

export const getChannelEmotes = async (channel) => {
  const puppeteerExtra = puppeteer.use(StealthPlugin())
  const browser = await puppeteerExtra.launch({ headless: "new" })
  const page = await browser.newPage()
  await page.goto(`https://kick.com/emotes/${channel}`)
  await page.waitForSelector("body")

  try {
    const emotesContent = await page.evaluate(() => {
      const bodyElement = document.querySelector("body")
      const bodyText = bodyElement ? bodyElement.textContent : null
      return bodyText ? JSON.parse(bodyText) : null
    })
    await browser.close()
    return emotesContent
  } catch (err) {
    await browser.close()
    throw err
  }
}

export const getChannelData = async (channel) => {
  const puppeteerExtra = puppeteer.use(StealthPlugin())
  const browser = await puppeteerExtra.launch({ headless: "new" })
  const page = await browser.newPage()
  await page.goto(`https://kick.com/api/v2/channels/${channel}`)
  await page.waitForSelector("body")
  try {
    const jsonContent = await page.evaluate(() => {
      const bodyElement = document.querySelector("body")
      const bodyText = bodyElement ? bodyElement.textContent : null
      return bodyText ? JSON.parse(bodyText) : null
    })
    await browser.close()
    runtimeChannelData.set(jsonContent.chatroom.id, jsonContent.slug)
    return jsonContent
  } catch (err) {
    await browser.close() // Ensure the browser is closed in case of an error
    throw err
  }
}

export const getChatroomId = async (channels) => {
  let chatroomIds = []
  for (const channel of channels) {
    const channelData = await getChannelData(channel)
    const chatRoomId = channelData.chatroom.id
    chatroomIds.push(chatRoomId)
  }
  return chatroomIds
}

export const getChannelIdRealtime = (map, channelName) => {
  for (const [key, val] of map.entries()) {
    if (val === channelName) {
      return key
    }
  }
  return undefined
}