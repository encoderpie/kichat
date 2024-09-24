import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

let browser = null;

async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({ headless: "new" });
  }
  return browser;
}

async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

export const runtimeChannelData = new Map();

export async function getChannel7TVEmotes(channelId) {
  const response = await fetch(`https://7tv.io/v3/users/kick/${channelId}`);
  return response.json();
}

async function getPageContent(url) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle0" });

  try {
    const content = await page.evaluate(evaluatePageContent);
    await page.close();

    if (content !== null) {
      return content;
    } else {
      throw new Error(`Invalid or empty content received from ${url}`);
    }
  } catch (err) {
    console.error(`Error fetching content from ${url}:`, err);
    await page.close();
    throw err;
  }
}

function evaluatePageContent() {
  const bodyElement = document.querySelector("body");
  if (!bodyElement) return null;

  const rawText = bodyElement.textContent;

  if (!rawText || rawText.trim() === "") return null;

  try {
    return JSON.parse(rawText);
  } catch (jsonError) {
    console.warn("JSON parsing failed, returning raw text");
    return rawText;
  }
}

export const getOldMessagesOfChannel = (channelId) =>
  getPageContent(`https://kick.com/api/v2/channels/${channelId}/messages`);

export const getChannelEmotes = (channel) =>
  getPageContent(`https://kick.com/emotes/${channel}`);

export async function getChannelData(channel) {
  const jsonContent = await getPageContent(
    `https://kick.com/api/v2/channels/${channel}`
  );
  if (jsonContent) {
    runtimeChannelData.set(jsonContent.chatroom.id, jsonContent.slug);
  }
  return jsonContent;
}

export async function getChatroomId(channels) {
  return Promise.all(
    channels.map(async (channel) => {
      const channelData = await getChannelData(channel);
      return channelData.chatroom.id;
    })
  );
}

export function getChannelIdRealtime(map, channelName) {
  for (const [key, val] of map.entries()) {
    if (val === channelName) {
      return key;
    }
  }
  return undefined;
}

process.on("exit", closeBrowser);
