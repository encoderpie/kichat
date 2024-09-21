const { ipcRenderer } = require('electron')
const chatsDiv = document.getElementById('chats')
const tabsDiv = document.getElementById('tabs')
const addChannelButton = document.getElementById('addChannelButton')
const channelModal = document.getElementById('channelModal')
const modalChannelInput = document.getElementById('modalChannelInput')
const modalAddChannelButton = document.getElementById('modalAddChannelButton')

const defaultChannels = [] // ['encoderpie', 'flundar']
const existingChannels = new Map()
const MAX_MESSAGES = 500


document.addEventListener('DOMContentLoaded', () => {
    // Home tab events
    const homeTabButton = document.getElementById('homeTabButton')
    const homeTabTextButton = document.getElementById('tab-home')
    
    existingChannels.set('home', { tab_active: false })
    homeTabButton.addEventListener('click', () => {
        setActiveChannel('home')
    })
    homeTabButton.addEventListener('mouseenter', () => {
        homeTabTextButton.classList.remove('opacity-60')
        homeTabTextButton.classList.add('opacity-100')
    })
    homeTabButton.addEventListener('mouseleave', () => {
        homeTabTextButton.classList.add('opacity-60')
        homeTabTextButton.classList.remove('opacity-100')
    })

    defaultChannels.forEach(channel => {
        createChannelTab(channel)
    })

    ipcRenderer.send('connect-channels', defaultChannels)
})

ipcRenderer.on('message', (event, message) => {
    const channelChatDiv = document.getElementById(`chat-${message.channel_name}`)
    if (channelChatDiv) {
        const messageElement = document.createElement('div')
        const channelData = existingChannels.get(message.channel_name)
        const channelSubscriberBadges = channelData.subscriber_badges
        const channelEmotes7tv = channelData.chatroom.emotes7tv
        console.log("Message:", message) 
        /* console.log("Channel Data:", channelData) 
        console.log("channelSubscriberBadges:", channelSubscriberBadges) 
        console.log("Message Badges:", message.badges) 
        console.log("Message:", message) 
        console.log("channelEmotes7tv:", channelEmotes7tv)  */

        let badgesHTML = ''
        if (Array.isArray(message.badges)) {
            for (let i = 0; i < message.badges.length; i++) {
                if (message.badges[i].type === 'subscriber') {
                    //console.log("Subscriber Badge:", message.badges[i])
                    const count = message.badges[i].count

                    // Kullanıcı rozet değerinden küçük veya eşit olan en büyük kanal rozet değerini bul
                    let matchingBadge = null;
                    for (let j = 0; j < channelSubscriberBadges.length; j++) {
                        if (channelSubscriberBadges[j].months <= count) {
                            if (!matchingBadge || channelSubscriberBadges[j].months > matchingBadge.months) {
                                matchingBadge = channelSubscriberBadges[j];
                            }
                        }
                    }

                    if (matchingBadge) {
                        //console.log("Matching Badge:", matchingBadge)
                        const badgeInfo = `${count} Months Subscriber`
                        badgesHTML += `<img src="${matchingBadge.badge_image.src}" class="w-4" alt="${badgeInfo}" title="${badgeInfo}" />`
                    } else {
                        //console.log("No matching badge found that is less than or equal to the subscriber count.")
                    }
                }
                if (message.badges[i].type === 'moderator') {
                    badgesHTML += `<svg version="1.1" x="0px" y="0px" viewBox="0 0 16 16" title="Moderator" xml:space="preserve" width="16" height="16"><path d="M11.7,1.3v1.5h-1.5v1.5
                        H8.7v1.5H7.3v1.5H5.8V5.8h-3v3h1.5v1.5H2.8v1.5H1.3v3h3v-1.5h1.5v-1.5h1.5v1.5h3v-3H8.7V8.7h1.5V7.3h1.5V5.8h1.5V4.3h1.5v-3
                        C14.7,1.3,11.7,1.3,11.7,1.3z" style="fill: rgb(0, 199, 255);"></path>
                    </svg>`
                }
                if (message.badges[i].type === 'founder') {
                    badgesHTML += `<svg version="1.1" x="0px" y="0px" viewBox="0 0 16 16" title="Founder" xml:space="preserve" width="16" height="16"><linearGradient id="badge-founder-gradient" gradientUnits="userSpaceOnUse" x1="7.874" y1="20.2333" x2="8.1274" y2="-0.3467" gradientTransform="matrix(1 0 0 -1 0 18)"><stop offset="0" style="stop-color: rgb(255, 201, 0);"></stop><stop offset="0.99" style="stop-color: rgb(255, 149, 0);"></stop></linearGradient><path d="
                        M14.6,4V2.7h-1.3V1.4H12V0H4v1.4H2.7v1.3H1.3V4H0v8h1.3v1.3h1.4v1.3H4V16h8v-1.4h1.3v-1.3h1.3V12H16V4H14.6z M9.9,12.9H6.7V6.4H4.5
                        V5.2h1V4.1h1v-1h3.4V12.9z" style="fill-rule: evenodd; clip-rule: evenodd; fill: #ffad00;"></path>
                    </svg>`
                }
                if (message.badges[i].type === 'vip') {
                    badgesHTML += `<svg version="1.1" x="0px" y="0px" viewBox="0 0 16 16" xml:space="preserve" width="16" height="16"><linearGradient id="badge-vip-gradient" gradientUnits="userSpaceOnUse" x1="8" y1="-163.4867" x2="8" y2="-181.56" gradientTransform="matrix(1 0 0 -1 0 -164)"><stop offset="0" style="stop-color: rgb(255, 201, 0);"></stop><stop offset="0.99" style="stop-color: rgb(255, 149, 0);"></stop></linearGradient><path d="M13.9,2.4v1.1h-1.2v2.3
                        h-1.1v1.1h-1.1V4.6H9.3V1.3H6.7v3.3H5.6v2.3H4.4V5.8H3.3V3.5H2.1V2.4H0v12.3h16V2.4H13.9z" style="fill: #ffad00;"></path>
                    </svg>`
                }
                if (message.badges[i].type === 'verified') {
                    badgesHTML += `<svg data-v-e4d376bf="" width="16" height="16" title="Verified" viewBox="0 0 16 16" style="color: rgb(83 252 24);" class="fill-current text-primary" xmlns="http://www.w3.org/2000/svg"><path d="M16 6.83512L13.735 4.93512L13.22 2.02512H10.265L8 0.120117L5.735 2.02012H2.78L2.265 4.93012L0 6.83512L1.48 9.39512L0.965 12.3051L3.745 13.3151L5.225 15.8751L8.005 14.8651L10.785 15.8751L12.265 13.3151L15.045 12.3051L14.53 9.39512L16.01 6.83512H16ZM6.495 12.4051L2.79 8.69512L4.205 7.28012L6.495 9.57512L11.29 4.78012L12.705 6.19512L6.5 12.4001L6.495 12.4051Z"></path></svg>`
                }
                if (message.badges[i].type === 'og') {
                    badgesHTML += `<svg version="1.1" x="0px" y="0px" title="OG" viewBox="0 0 16 16" xml:space="preserve" width="16" height="16"><g><linearGradient id="badge-og-gradient-1" gradientUnits="userSpaceOnUse" x1="12.2" y1="-180" x2="12.2" y2="-165.2556" gradientTransform="matrix(1 0 0 -1 0 -164)"><stop offset="0" style="stop-color:#00FFF2;"></stop><stop offset="0.99" style="stop-color:#006399;"></stop></linearGradient><path style="fill:url(#badge-og-gradient-1);" d="M16,16H9.2v-0.8H8.4v-8h0.8V6.4H16v3.2h-4.5v4.8H13v-1.6h-0.8v-1.6H16V16z"></path><linearGradient id="badge-og-gradient-2" gradientUnits="userSpaceOnUse" x1="3.7636" y1="-164.265" x2="4.0623" y2="-179.9352" gradientTransform="matrix(1 0 0 -1 0 -164)"><stop offset="0" style="stop-color:#00FFF2;"></stop><stop offset="0.99" style="stop-color:#006399;"></stop></linearGradient><path style="fill:url(#badge-og-gradient-2);" d="M6.8,8.8v0.8h-6V8.8H0v-8h0.8V0h6.1v0.8
                        h0.8v8H6.8z M4.5,6.4V1.6H3v4.8H4.5z"></path><path style="fill:#00FFF2;" d="M6.8,15.2V16h-6v-0.8H0V8.8h0.8V8h6.1v0.8h0.8v6.4C7.7,15.2,6.8,15.2,6.8,15.2z M4.5,14.4V9.6H3v4.8
                        C3,14.4,4.5,14.4,4.5,14.4z"></path><path style="fill:#00FFF2;" d="M16,8H9.2V7.2H8.4V0.8h0.8V0H16v1.6h-4.5v4.8H13V4.8h-0.8V3.2H16V8z"></path></g>
                    </svg>`
                }
                if (message.badges[i].type === 'sub_gifter') {
                    badgesHTML += `<svg width="16" height="16" title="Sub Gifter" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_301_17810)"><path d="M7.99999 9.14999V6.62499L0.484985 3.35999V6.34499L1.15499 6.63499V12.73L7.99999 15.995V9.14999Z" fill="#0269D4"></path><path d="M8.00003 10.735V9.61501L1.15503 6.63501V7.70501L8.00003 10.735Z" fill="#0269D4"></path><path d="M15.515 3.355V6.345L14.85 6.64V12.73L12.705 13.755L11.185 14.48L8.00499 15.995V6.715L4.81999 5.295H4.81499L3.29499 4.61L0.484985 3.355L3.66999 1.935L3.67999 1.93L5.09499 1.3L8.00499 0L10.905 1.3L12.32 1.925L12.33 1.935L15.515 3.355Z" fill="#04D0FF"></path><path d="M14.845 6.63501V7.70501L8 10.735V9.61501L14.845 6.63501Z" fill="#0269D4"></path></g><defs><clipPath id="clip0_301_17810"><rect width="16" height="16" fill="white"></rect></clipPath></defs></svg>`
                }
                if (message.badges[i].type === 'broadcaster') {
                    badgesHTML += `<svg version="1.1" x="0px" y="0px" title="Broadcaster" viewBox="0 0 16 16" xml:space="preserve" width="16" height="16"><g id="Badge_Chat_host"><linearGradient id="badge-host-gradient-1" gradientUnits="userSpaceOnUse" x1="4" y1="180.5864" x2="4" y2="200.6666" gradientTransform="matrix(1 0 0 1 0 -182)"><stop offset="0" style="stop-color:#FF1CD2;"></stop><stop offset="0.99" style="stop-color:#B20DFF;"></stop></linearGradient><rect x="3.2" y="9.6" style="fill:url(#badge-host-gradient-1);" width="1.6" height="1.6"></rect><linearGradient id="badge-host-gradient-2" gradientUnits="userSpaceOnUse" x1="8" y1="180.5864" x2="8" y2="200.6666" gradientTransform="matrix(1 0 0 1 0 -182)"><stop offset="0" style="stop-color:#FF1CD2;"></stop><stop offset="0.99" style="stop-color:#B20DFF;"></stop></linearGradient><polygon style="fill:url(#badge-host-gradient-2);" points="6.4,9.6 9.6,9.6 9.6,8 11.2,8 
                        11.2,1.6 9.6,1.6 9.6,0 6.4,0 6.4,1.6 4.8,1.6 4.8,8 6.4,8 	"></polygon><linearGradient id="badge-host-gradient-3" gradientUnits="userSpaceOnUse" x1="2.4" y1="180.5864" x2="2.4" y2="200.6666" gradientTransform="matrix(1 0 0 1 0 -182)"><stop offset="0" style="stop-color:#FF1CD2;"></stop><stop offset="0.99" style="stop-color:#B20DFF;"></stop></linearGradient><rect x="1.6" y="6.4" style="fill:url(#badge-host-gradient-3);" width="1.6" height="3.2"></rect><linearGradient id="badge-host-gradient-4" gradientUnits="userSpaceOnUse" x1="12" y1="180.5864" x2="12" y2="200.6666" gradientTransform="matrix(1 0 0 1 0 -182)"><stop offset="0" style="stop-color:#FF1CD2;"></stop><stop offset="0.99" style="stop-color:#B20DFF;"></stop></linearGradient><rect x="11.2" y="9.6" style="fill:url(#badge-host-gradient-4);" width="1.6" height="1.6"></rect><linearGradient id="badge-host-gradient-5" gradientUnits="userSpaceOnUse" x1="8" y1="180.5864" x2="8" y2="200.6666" gradientTransform="matrix(1 0 0 1 0 -182)"><stop offset="0" style="stop-color:#FF1CD2;"></stop><stop offset="0.99" style="stop-color:#B20DFF;"></stop></linearGradient><polygon style="fill:url(#badge-host-gradient-5);" points="4.8,12.8 6.4,12.8 6.4,14.4 
                        4.8,14.4 4.8,16 11.2,16 11.2,14.4 9.6,14.4 9.6,12.8 11.2,12.8 11.2,11.2 4.8,11.2 	"></polygon><linearGradient id="badge-host-gradient-6" gradientUnits="userSpaceOnUse" x1="13.6" y1="180.5864" x2="13.6" y2="200.6666" gradientTransform="matrix(1 0 0 1 0 -182)"><stop offset="0" style="stop-color:#FF1CD2;"></stop><stop offset="0.99" style="stop-color:#B20DFF;"></stop></linearGradient><rect x="12.8" y="6.4" style="fill:url(#badge-host-gradient-6);" width="1.6" height="3.2"></rect></g>
                    </svg>`
                }

                // other badges...
            }
        }

        // Converting UTC date to users local time zone
        const utcDate = new Date(message.created_at);
        const localDate = utcDate.toLocaleString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
            //second: '2-digit',
            hour12: false
        })
        const localDateHTML = `<span class="opacity-60" style="font-weight: lighter; font-size: 12px;">${localDate}</span>`


        let messageReplyElementHTML = ""
        if (message.type == 'reply') {
            messageReplyElementHTML = `
                <div class="opacity-60 flex items-center space-x-1">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.32004 4.41501H7.51004V1.29001L1.41504 5.66501L7.51004 10.04V6.91501H9.32004C10.805 6.91501 12.01 8.12501 12.01 9.60501C12.01 11.085 10.8 12.295 9.32004 12.295H4.46004V14.795H9.32004C12.185 14.795 14.51 12.465 14.51 9.60501C14.51 6.74501 12.18 4.41501 9.32004 4.41501Z" fill="currentColor"></path></svg>
                    <span class="pe-1">@${message.metadata.original_sender.username}:</span>${message.metadata.original_message.content}
                </div>`
        }

        const usernameHTML = `<span class="font-semibold text-[${message.sender.identity.color}]">${message.sender.username}:</span>`

        const messageWith7TVEmotes = (msg) => {
            const words = msg.split(" ")
            const msg_replaced = words.map(word => {
                const finded = channelEmotes7tv.emote_set.emotes.find(emote => emote.name === word)
                if (finded) {
                    const imgSrc = finded.data.host.url + '/' + (finded.data.host.files?.[0]?.name || "1x.avif")
                    return `<img src="${imgSrc}" alt="${word}" title="${word}" width="24" height="24" class="mx-1 inline-block static">`;
                }
                return word
            }).join(" ")
            return msg_replaced
        }
        
        let renderMessage =  message.content
        
        if (channelEmotes7tv?.emote_set?.emotes?.length > 0) {
            renderMessage = messageWith7TVEmotes(renderMessage)
        }

        const messageWithEmotes = (msg) => {
            const emoteRegex = /\[emote:(\d+):[^\]]+\]/g
            const msg_replaced = msg.replace(emoteRegex, (match, emoteId) => {
                const imgSrc = `https://files.kick.com/emotes/${emoteId}/fullsize`
                return `<img src="${imgSrc}" alt="emote" width="24" height="24" class="mx-1 inline-block static">`
            })
            return msg_replaced
        }

        renderMessage = messageWithEmotes(renderMessage)

        messageElement.innerHTML = `
            <div id="message-container">
                ${messageReplyElementHTML}
                <span class="flex items-center space-x-1 float-start me-1">
                    ${localDateHTML} ${badgesHTML} ${usernameHTML}
                </span>
                <span class="static break-words">${renderMessage}</span>
            </div>`
        messageElement.className = `p-1 text-start hover:bg-slate-700/50 ${message.type == 'old-message' ? 'opacity-70' : ''}`
        messageElement.setAttribute('data-message-id', message.id)

        channelChatDiv.appendChild(messageElement)
        
        removeOldMessages(channelChatDiv)

        const autoScroll = channelChatDiv.getAttribute('data-auto-scroll') === 'true'
        const scrollDownButton = channelChatDiv.querySelector('.scroll-down-button')

        if (autoScroll) {
            channelChatDiv.scrollTop = channelChatDiv.scrollHeight
            hideScrollDownButton(scrollDownButton)
        } else {
            showScrollDownButton(scrollDownButton)
        }
    }
})

ipcRenderer.on('server-message', (event, message) => {
    const channelChatDiv = document.getElementById(`chat-${message.channel}`)
    if (channelChatDiv) {
        const messageElement = document.createElement('div')
        switch (message.status) {
            case 'connecting':
                messageElement.textContent = `Receiving messages from channel #${message.channel}...`
                console.log('Connecting to [tab name]:', message.channel);
                const createdTabChannelData = existingChannels.get(message.channel)
                if (createdTabChannelData.tab_active) {
                    console.log(`Connecting to [tab name]: ${message.channel} [tab active].`);
                } else {
                    console.log(`Connecting to [tab name]: ${message.channel} [tab not active].`);
                }
                existingChannels.set(message.channel, { ...message.channelData, tab_active: createdTabChannelData.tab_active });
                break
            case 'connected':
                messageElement.textContent = `Connected to #${message.channel}`
                break
            case 'disconnected':
                messageElement.textContent = `Disconnected from #${message.channel}!`
                existingChannels.delete(message.channel) // Remove from map when channel is disconnected
                break
            default:
                break
        }
        messageElement.className = 'p-1'
        channelChatDiv.appendChild(messageElement)
        
        // Check the number of messages and delete old messages if necessary
        removeOldMessages(channelChatDiv)

        const autoScroll = channelChatDiv.getAttribute('data-auto-scroll') === 'true'
        const scrollDownButton = channelChatDiv.querySelector('.scroll-down-button')

        if (autoScroll) {
            channelChatDiv.scrollTop = channelChatDiv.scrollHeight // go to bottom
            hideScrollDownButton(scrollDownButton)
        } else {
            showScrollDownButton(scrollDownButton)
        }
    }
})

ipcRenderer.on('message-deleted', (event, data) => {
    console.log('MESSAGE DELETED', data);
    const channelChatDiv = document.getElementById(`chat-${data.channel_name}`)
    if (channelChatDiv) {
        const messageDiv = channelChatDiv.querySelector(`div[data-message-id="${data.message.id}"]`)

        if (messageDiv) {
            messageDiv.classList.add('!opacity-40')
            messageDiv.setAttribute('data-deleted', 'true')
            const messageContainerDiv = messageDiv.querySelector('#message-container')
            const deletedText = document.createElement('span')
            deletedText.classList.add('ms-1', 'font-semibold')
            deletedText.innerText = '(Deleted)'
            messageContainerDiv.appendChild(deletedText)
        }

        // Check the number of messages and delete old messages if necessary
        removeOldMessages(channelChatDiv)

        const autoScroll = channelChatDiv.getAttribute('data-auto-scroll') === 'true'
        const scrollDownButton = channelChatDiv.querySelector('.scroll-down-button')

        if (autoScroll) {
            channelChatDiv.scrollTop = channelChatDiv.scrollHeight // go to bottom
            hideScrollDownButton(scrollDownButton)
        } else {
            showScrollDownButton(scrollDownButton)
        }
    }
})

ipcRenderer.on('user-banned', (event, data) => {
    console.log('USER BANNED', data);
    const channelChatDiv = document.getElementById(`chat-${data.channel_name}`)
    if (channelChatDiv) {
        const messageElement = document.createElement('div')
        if (data.permanent) {
            messageElement.textContent = `${data.banned_by.username} has permanently banned ${data.user.slug}`
        } else {
            messageElement.textContent = `${data.banned_by.username} has timed out ${data.user.slug} from chat. Timeout duration: ${data.duration} minute(s)`
        }

        messageElement.className = 'p-1'
        channelChatDiv.appendChild(messageElement)
        
        // Check the number of messages and delete old messages if necessary
        removeOldMessages(channelChatDiv)

        const autoScroll = channelChatDiv.getAttribute('data-auto-scroll') === 'true'
        const scrollDownButton = channelChatDiv.querySelector('.scroll-down-button')

        if (autoScroll) {
            channelChatDiv.scrollTop = channelChatDiv.scrollHeight // go to bottom
            hideScrollDownButton(scrollDownButton)
        } else {
            showScrollDownButton(scrollDownButton)
        }
    }
})

ipcRenderer.on('user-unbanned', (event, data) => {
    console.log('USER UNBANNED', data);
    const channelChatDiv = document.getElementById(`chat-${data.channel_name}`)
    if (channelChatDiv) {
        const messageElement = document.createElement('div')
        messageElement.textContent = `${data.unbanned_by.username} has unbanned ${data.user.slug}`

        messageElement.className = 'p-1'
        channelChatDiv.appendChild(messageElement)
        
        // Check the number of messages and delete old messages if necessary
        removeOldMessages(channelChatDiv)

        const autoScroll = channelChatDiv.getAttribute('data-auto-scroll') === 'true'
        const scrollDownButton = channelChatDiv.querySelector('.scroll-down-button')

        if (autoScroll) {
            channelChatDiv.scrollTop = channelChatDiv.scrollHeight // go to bottom
            hideScrollDownButton(scrollDownButton)
        } else {
            showScrollDownButton(scrollDownButton)
        }
    }
})

addChannelButton.addEventListener('click', () => {
    addChannelButton.classList.add('hidden')
    channelModal.classList.remove('hidden')
    modalChannelInput.focus() // Focus input

    // Hide modal if click somewhere outside modal
    function handleClickOutside(event) {
        if (!channelModal.contains(event.target) && !addChannelButton.contains(event.target)) {
            channelModal.classList.add('hidden')
            addChannelButton.classList.remove('hidden')
            document.removeEventListener('click', handleClickOutside)
        }
    }

    setTimeout(() => {
        document.addEventListener('click', handleClickOutside)
    }, 0)
})

modalAddChannelButton.addEventListener('click', addChannel)
modalChannelInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        addChannel()
    }
})



function addChannel() {
    const channel = modalChannelInput.value.trim()
    if (channel) {
        if (existingChannels.has(channel)) {
            // Make all channels tab_active: false
            for (const [channel, data] of existingChannels.entries()) {
                existingChannels.set(channel, { ...data, tab_active: false });
            }

            // Make the new channel tab_active: true
            existingChannels.set(channel, { ...existingChannels.get(channel), tab_active: true });

            console.log(`Adding channel ${channel} [tab active].`);
        } else {
            createChannelTab(channel)
            ipcRenderer.send('connect-channels', [channel])
            
            console.log(`Channel ${channel} not found in the tab menu, creating a new tab...`);
        }
        channelModal.classList.add('hidden')
        addChannelButton.classList.remove('hidden')
        modalChannelInput.value = ''
    }
}

function createChannelTab(channel) {
    let tabButton = document.createElement('div')
    tabButton.className = ''

    let tabTextButton = document.createElement('button')
    tabTextButton.id = `tab-${channel}`
    tabTextButton.className = 'ps-4 pe-3 py-1 h-fit w-full border-t space-x-2 border-gray-500 bg-[var(--main-color)] flex items-center justify-between outline-none'
    tabTextButton.innerHTML = `<div>${channel}</div> 
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="3 3 10 10" fill="currentColor" class="opacity-0 p-0 pointer-events-none close-btn size-2" id="close-${channel}">
        <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
    </svg>`

    tabButton.addEventListener('click', (event) => {
        if (event.target.closest('.close-btn')) {
            event.stopPropagation()
            removeChannel(channel)
        } else {
            setActiveChannel(channel)
        }
    })

    tabButton.addEventListener('mouseenter', () => {
        tabTextButton.classList.remove('opacity-60')
        tabTextButton.classList.add('opacity-80')
        const tabCloseButton = tabTextButton.querySelector('.close-btn')
        tabCloseButton.classList.add('opacity-100')
        tabCloseButton.classList.remove('opacity-0')
        tabCloseButton.classList.remove('pointer-events-none')
    })

    tabButton.addEventListener('mouseleave', () => {
        tabTextButton.classList.add('opacity-60')
        tabTextButton.classList.remove('opacity-80')
        const tabCloseButton = tabTextButton.querySelector('.close-btn')
        tabCloseButton.classList.remove('opacity-100')
        tabCloseButton.classList.add('opacity-0')
        tabCloseButton.classList.add('pointer-events-none')
    })

    tabButton.appendChild(tabTextButton)
    tabsDiv.insertBefore(tabButton, addChannelButton)


    let channelChatContainer = document.createElement('div')
    channelChatContainer.setAttribute("id", `chat-container-${channel}`)
    channelChatContainer.className = 'grid grid-rows-[1fr_auto] w-full h-full hidden'

    let channelChatDiv = document.createElement('div')
    channelChatDiv.setAttribute("id", `chat-${channel}`)
    channelChatDiv.className = 'w-full overflow-y-auto'
    channelChatDiv.setAttribute('data-auto-scroll', 'true')

    const scrollDownButton = document.createElement('button')
    scrollDownButton.className = 'scroll-down-button hidden absolute bottom-11 w-full bg-black/70 text-white py-1.5 text-xs'
    scrollDownButton.textContent = 'More messages below'
    scrollDownButton.addEventListener('click', () => {
        channelChatDiv.scrollTop = channelChatDiv.scrollHeight
        channelChatDiv.setAttribute('data-auto-scroll', 'true')
        hideScrollDownButton(scrollDownButton)
    })
    channelChatDiv.appendChild(scrollDownButton)

    channelChatDiv.addEventListener('scroll', () => {
        if (channelChatDiv.scrollTop + channelChatDiv.clientHeight < channelChatDiv.scrollHeight - 40) {
            channelChatDiv.setAttribute('data-auto-scroll', 'false')
            showScrollDownButton(scrollDownButton)
        } else {
            channelChatDiv.setAttribute('data-auto-scroll', 'true')
            hideScrollDownButton(scrollDownButton)
        }
    })

    // Connecting message added to the chat
    const messageElement = document.createElement('div')
    messageElement.textContent = `Connecting to #${channel}...`
    messageElement.className = 'p-1'
    channelChatDiv.appendChild(messageElement)

    channelChatContainer.appendChild(channelChatDiv)


    const messageInputContainer = document.createElement('div')
    messageInputContainer.className = 'w-full bg-[--box-color] border-t border-gray-700 flex items-center'
    const messageInput = document.createElement('input')
    messageInput.type = 'text'
    messageInput.id = 'message-input-' + channel
    messageInput.className = 'flex-grow text-white bg-[--box-color] p-2 py-3 focus:outline-none'
    messageInput.placeholder = 'Type your message...'
    messageInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            console.log('Enter pressed in message input', channel, event.target.value)
            sendMessage(channel, event.target.value)
        }
    })
    messageInputContainer.appendChild(messageInput)

    channelChatContainer.appendChild(messageInputContainer)
    chatsDiv.appendChild(channelChatContainer)

    
    let tabData = {slug: channel, tab_active: false}
    existingChannels.set(channel, tabData)
    setActiveChannel(channel)
}
function setActiveChannel(channel) {
    console.log('CHANNEL TO BE ACTIVATED:', existingChannels.get(channel))
    // Set tab_active: false for all channels
    for (const [c, cd] of existingChannels.entries()) {
        existingChannels.set(c, { ...cd, tab_active: false })
    }
    
    // Set tab_active: true for the related channel
    if (existingChannels.has(channel)) {
        console.log('Channel exists. Activating tab...')
        existingChannels.set(channel, { ...existingChannels.get(channel), tab_active: true })
    } else {
        console.log(`Channel ${channel} does not exist.`)
    }
    console.log('ACTIVATED CHANNEL:', existingChannels.get(channel))
    
    Array.from(tabsDiv.children).forEach(tab => {
        const tabTextButton = tab.querySelector('button:first-child')
        if (tabTextButton) {
            tabTextButton.classList.remove('!border-blue-300')
            tabTextButton.classList.add('opacity-60')
            tabTextButton.classList.remove('!opacity-100')
            tabTextButton.classList.remove('bg-blue-500')
            if (tabTextButton.id === `tab-${channel}`) {
                tabTextButton.classList.add('!border-blue-300', '!opacity-100')
                tabTextButton.classList.remove('opacity-60')
                if (channel === 'home') {
                    tabTextButton.classList.add('bg-slate-800')
                }
            }
        }
    })
    Array.from(chatsDiv.children).forEach(chatContainer => {
        chatContainer.classList.add('hidden')
        if (chatContainer.id === `chat-container-${channel}`) {
            chatContainer.classList.remove('hidden')

            const chat = chatContainer.querySelector(`#chat-${channel}`)
            const autoScroll = chat.getAttribute('data-auto-scroll') === 'true'
            if (autoScroll) {
                chat.scrollTop = chat.scrollHeight // Scroll to bottom
            }
        }
    })
}


function removeChannel(channel) {
    const channelTab = Array.from(tabsDiv.children).find(tab => {
        const tabTextButton = tab.querySelector('button:first-child')
        return tabTextButton && tabTextButton.textContent.includes(channel)
    })

    const channelChatDiv = document.getElementById(`chat-container-${channel}`)

    if (channelTab) {
        tabsDiv.removeChild(channelTab)
    }

    if (channelChatDiv) {
        chatsDiv.removeChild(channelChatDiv)
    }

    existingChannels.delete(channel)
    ipcRenderer.send('disconnect-channel', channel)

    const firstChannel = existingChannels.keys().next().value
    setActiveChannel(firstChannel)
}

function sendMessage(channel, message) {
    const channelData = existingChannels.get(channel)
    ipcRenderer.send('send-message', { message, channelData })
    console.log(`Message to send: ${message} to channel: ${channelData.slug}`, { message, channel: channelData.slug })
    const chatMessageSendInput = document.getElementById(`message-input-${channel}`)
    chatMessageSendInput.value = ''
}


function showScrollDownButton(button) {
    button.classList.remove('hidden')
}

function hideScrollDownButton(button) {
    button.classList.add('hidden')
}

function removeOldMessages(channelChatDiv) {
    const messages = channelChatDiv.querySelectorAll('div')
    if (messages.length > MAX_MESSAGES) {
        messages[0].remove() // Delete the message at the top
    }
}
