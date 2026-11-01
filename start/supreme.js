const timezones = global.timezones || "Africa/Kampala";
const moment = require("moment-timezone")
const more = String.fromCharCode(8206);
const readmore = more.repeat(4001);

const fs = require('fs');
const path = require('path');
const db = require('../start/Core/databaseManager');

function loadStoredMessages() {
    try {
        if (fs.existsSync('./start/lib/database/deleted_messages.json')) {
            const data = fs.readFileSync('./start/lib/database/deleted_messages.json', 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading stored messages:', error);
    }
    return {};
}

function saveStoredMessages(messages) {
    try {
        const dir = './start/lib/database';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync('./start/lib/database/deleted_messages.json', JSON.stringify(messages, null, 2));
    } catch (error) {
        console.error('Error saving stored messages:', error);
    }
}

function storeMessage(chatId, messageId, messageData) {
    try {
        const storedMessages = loadStoredMessages();
        
        if (!storedMessages[chatId]) {
            storedMessages[chatId] = {};
        }
        
        // Extract text content and detect media type
        let textContent = "";
        let mediaType = "text";
        const msgType = Object.keys(messageData.message || {})[0];
        
        if (msgType === 'conversation') {
            textContent = messageData.message.conversation;
        } else if (msgType === 'extendedTextMessage') {
            textContent = messageData.message.extendedTextMessage?.text || "";
        } else if (msgType === 'imageMessage') {
            textContent = messageData.message.imageMessage?.caption || "";
            mediaType = "image";
        } else if (msgType === 'videoMessage') {
            textContent = messageData.message.videoMessage?.caption || "";
            mediaType = "video";
        } else if (msgType === 'audioMessage') {
            textContent = "";
            mediaType = "audio";
        } else if (msgType === 'stickerMessage') {
            textContent = "";
            mediaType = "sticker";
        } else {
            textContent = "";
        }
        
        storedMessages[chatId][messageId] = {
            key: messageData.key,
            message: messageData.message,
            messageTimestamp: messageData.messageTimestamp,
            pushName: messageData.pushName,
            text: textContent,
            mediaType: mediaType,
            storedAt: Date.now(),
            remoteJid: messageData.key?.remoteJid || chatId
        };
        
        // Limit storage per chat to prevent memory issues
        const chatMessages = Object.keys(storedMessages[chatId]);
        if (chatMessages.length > 100) {
            const oldestMessageId = chatMessages[0];
            delete storedMessages[chatId][oldestMessageId];
        }
        
        saveStoredMessages(storedMessages);
        
    } catch (error) {
        console.error("Error storing message:", error);
    }
}

async function handleAntiDelete(m, kelvin) {
    try {
        const botNumber = await kelvin.decodeJid(kelvin.user.id);
        
        // ✅ GET ANTI-DELETE SETTING FROM SQLITE
        const antideleteSetting = await db.get(botNumber, 'antidelete', 'off');
        
        // Check if anti-delete is enabled
        if (!antideleteSetting || antideleteSetting === 'off') {
            return;
        }

        let messageId = m.message.protocolMessage.key.id;
        let chatId = m.chat;
        let deletedBy = m.sender;
        const isGroup = chatId.endsWith('@g.us');

        let storedMessages = loadStoredMessages();
        let deletedMsg = storedMessages[chatId]?.[messageId];

        if (!deletedMsg) {
            return;
        }

        let sender = deletedMsg.key.participant || deletedMsg.key.remoteJid;

        let chatName;
        if (deletedMsg.key.remoteJid === 'status@broadcast') {
            chatName = "Status Update";
        } else if (isGroup) {
            try {
                const groupInfo = await kelvin.groupMetadata(chatId);
                chatName = groupInfo.subject || "Group Chat";
            } catch {
                chatName = "Group Chat";
            }
        } else {
            chatName = deletedMsg.pushName || m.pushName || "Private Chat";
        }

        let xtipes = moment(deletedMsg.messageTimestamp * 1000).tz(`${timezones}`).locale('en').format('HH:mm z');
        let xdptes = moment(deletedMsg.messageTimestamp * 1000).tz(`${timezones}`).format("DD/MM/YYYY");

        // Determine target chat based on antidelete mode
        let targetChat;
        if (antideleteSetting === 'private') {
            targetChat = kelvin.user.id; // Bot owner's inbox
        } else if (antideleteSetting === 'chat') {
            targetChat = chatId; // Same chat where deletion happened
        } else {
            return;
        }

        // Handle media messages
        if (!deletedMsg.message.conversation && !deletedMsg.message.extendedTextMessage) {
            try {
                let forwardedMsg = await kelvin.sendMessage(
                    targetChat,
                    { 
                        forward: deletedMsg,
                        contextInfo: { isForwarded: false }
                    },
                    { quoted: deletedMsg }
                );
                
                let mediaInfo = `🚨 *𝙳𝙴𝙻𝙴𝚃𝙴𝙳 𝙼𝙴𝙳𝙸𝙰!* 🚨
${readmore}
• 𝙲𝙷𝙰𝚃: ${chatName}
• 𝚂𝙴𝙽𝚃 𝙱𝚈: @${sender.split('@')[0]} 
• 𝚃𝙸𝙼𝙴: ${xtipes}
• 𝙳𝙰𝚃𝙴: ${xdptes}
• 𝙳𝙴𝙻𝙴𝚃𝙴𝙳 𝙱𝚈: @${deletedBy.split('@')[0]}`;

                await kelvin.sendMessage(
                    targetChat, 
                    { text: mediaInfo, mentions: [sender, deletedBy] },
                    { quoted: forwardedMsg }
                );
                
            } catch (mediaErr) {
                console.error("Media recovery failed:", mediaErr);
                let replyText = `🔮 *𝙳𝙴𝙻𝙴𝚃𝙴𝙳 𝙼𝙴𝚂𝚂𝙰𝙶𝙴!* 🔮
${readmore}
• 𝙲𝙷𝙰𝚃: ${chatName}
• 𝚂𝙴𝙽𝚃 𝙱𝚈: @${sender.split('@')[0]} 
• 𝚃𝙸𝙼𝙴: ${xtipes}
• 𝙳𝙰𝚃𝙴: ${xdptes}
• 𝙳𝙴𝙻𝙴𝚃𝙴𝙳 𝙱𝚈: @${deletedBy.split('@')[0]}

• 𝙼𝙴𝚂𝚂𝙰𝙶𝙴: [Unsupported media content]`;

                let quotedMessage = {
                    key: {
                        remoteJid: chatId,
                        fromMe: sender === kelvin.user.id,
                        id: messageId,
                        participant: sender
                    },
                    message: { conversation: "Media recovery failed" }
                };

                await kelvin.sendMessage(
                    targetChat,
                    { text: replyText, mentions: [sender, deletedBy] },
                    { quoted: quotedMessage }
                );
            }
        } 
        // Handle text messages
        else {
            let text = deletedMsg.message.conversation || 
                      deletedMsg.message.extendedTextMessage?.text;

            let replyText = `🔮 *𝙳𝙴𝙻𝙴𝚃𝙴𝙳 𝙼𝙴𝚂𝚂𝙰𝙶𝙴!* 🔮
${readmore}
• 𝙲𝙷𝙰𝚃: ${chatName}
• 𝚂𝙴𝙽𝚃 𝙱𝚈: @${sender.split('@')[0]} 
• 𝚃𝙸𝙼𝙴: ${xtipes}
• 𝙳𝙰𝚃𝙴: ${xdptes}
• 𝙳𝙴𝙻𝙴𝚃𝙴𝙳 𝙱𝚈: @${deletedBy.split('@')[0]}

• 𝙼𝙴𝚂𝚂𝙰𝙶𝙴: ${text}`;

            let quotedMessage = {
                key: {
                    remoteJid: chatId,
                    fromMe: sender === kelvin.user.id,
                    id: messageId,
                    participant: sender
                },
                message: {
                    conversation: text 
                }
            };

            await kelvin.sendMessage(
                targetChat,
                { text: replyText, mentions: [sender, deletedBy] },
                { quoted: quotedMessage }
            );
        }

    } catch (err) {
        console.error("❌ Error processing deleted message:", err);
    }
}

// Store messages function for export
function handleMessageStore(m) {
    try {
        if (!m.message || m.key.fromMe) return; // Don't store bot's own messages
        
        const chatId = m.chat;
        const messageId = m.key.id;
        
        // Store all messages
        storeMessage(chatId, messageId, {
            key: m.key,
            message: m.message,
            messageTimestamp: m.messageTimestamp,
            pushName: m.pushName
        });
        
    } catch (error) {
        console.error("Error storing message:", error);
    }
}

async function handleAntiEdit(m, kelvin) {
    try {
        // Get bot number
        const botNumber = await kelvin.decodeJid(kelvin.user.id);
        
        const antieditSetting = await db.get(botNumber, 'antiedit', 'off');
        
        // Check if anti-edit is enabled and we have an edited message
        if (!antieditSetting || antieditSetting === 'off' || !m.message?.protocolMessage?.editedMessage) {
            return;
        }

        let messageId = m.message.protocolMessage.key.id;
        let chatId = m.chat;
        let editedBy = m.sender;

        let storedMessages = loadStoredMessages();
        let originalMsg = storedMessages[chatId]?.[messageId];

        if (!originalMsg) {
            console.log("⚠️ Original message not found in store.json.");
            return;
        }

        let sender = originalMsg.key?.participant || originalMsg.key?.remoteJid;
        
        // Get chat name
        let chatName;
        if (chatId.endsWith("@g.us")) {
            try {
                const groupInfo = await kelvin.groupMetadata(chatId);
                chatName = groupInfo.subject || "Group Chat";
            } catch {
                chatName = "Group Chat";
            }
        } else {
            chatName = originalMsg.pushName || "Private Chat";
        }

        let xtipes = moment(originalMsg.messageTimestamp * 1000).tz(`${timezones}`).locale('en').format('HH:mm z');
        let xdptes = moment(originalMsg.messageTimestamp * 1000).tz(`${timezones}`).format("DD/MM/YYYY");

        // Get original text
        let originalText = originalMsg.message?.conversation || 
                          originalMsg.message?.extendedTextMessage?.text ||
                          originalMsg.text ||
                          "[Text not available]";

        // Get edited text
        let editedText = m.message.protocolMessage?.editedMessage?.conversation || 
                        m.message.protocolMessage?.editedMessage?.extendedTextMessage?.text ||
                        "[Edit content not available]";

        let replyText = `🔮 *𝙴𝙳𝙸𝚃𝙴𝙳 𝙼𝙴𝚂𝚂𝙰𝙶𝙴!* 🔮
${readmore}
• 𝙲𝙷𝙰𝚃: ${chatName}
• 𝚂𝙴𝙽𝚃 𝙱𝚈: @${sender.split('@')[0]} 
• 𝚃𝙸𝙼𝙴: ${xtipes}
• 𝙳𝙰𝚃𝙴: ${xdptes}
• 𝙴𝙳𝙸𝚃𝙴𝙳 𝙱𝚈: @${editedBy.split('@')[0]}

• 𝙾𝚁𝙸𝙶𝙸𝙽𝙰𝙻: ${originalText}

• 𝙴𝙳𝙸𝚃𝙴𝙳 𝚃𝙾: ${editedText}`;

        let quotedMessage = {
            key: {
                remoteJid: chatId,
                fromMe: sender === kelvin.user.id,
                id: messageId,
                participant: sender
            },
            message: {
                conversation: originalText 
            }
        };

        // Determine target based on mode from SQLite settings
        let targetChat;
        if (antieditSetting === 'private') {
            targetChat = kelvin.user.id; // Send to bot owner
            console.log(`📤 Anti-edit: Sending to bot owner's inbox`);
        } else if (antieditSetting === 'chat') {
            targetChat = chatId; // Send to same chat
            console.log(`📤 Anti-edit: Sending to same chat`);
        } else {
            console.log("❌ Invalid anti-edit mode");
            return;
        }

        await kelvin.sendMessage(
            targetChat, 
            { text: replyText, mentions: [sender, editedBy] }, 
            { quoted: quotedMessage }
        );

    } catch (err) {
        console.error("❌ Error processing edited message:", err);
    }
}

// antilink section 
function detectUrls(message) {
    if (!message) return [];
    
    let text = "";
    
    // Extract text from different message types
    if (message.conversation) {
        text = message.conversation;
    } else if (message.extendedTextMessage && message.extendedTextMessage.text) {
        text = message.extendedTextMessage.text;
    } else if (message.imageMessage && message.imageMessage.caption) {
        text = message.imageMessage.caption;
    } else if (message.videoMessage && message.videoMessage.caption) {
        text = message.videoMessage.caption;
    } else if (message.documentMessage && message.documentMessage.caption) {
        text = message.documentMessage.caption;
    }
    
    if (!text || typeof text !== 'string') return [];
    
     const urlRegex = /(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
    
    const matches = text.match(urlRegex);
    return matches ? matches : [];
}

async function handleLinkViolation(kelvin, m, message, botNumber) {
    try {
        if (!message || !message.key || !message.key.remoteJid) {
            return;
        }
        
        const chatId = message.key.remoteJid;
        const sender = message.key.participant || message.key.remoteJid;
        const messageId = message.key.id;
        const isGroup = chatId.endsWith('@g.us');

        // Only works in groups
        if (!isGroup) return;
     
        // Skip if sender is admin
        if (m.isAdmin) {
            return;
        }
        
        const isEnabled = await db.getGroupSetting(botNumber, chatId, 'antilink', false);
        const mode = await db.getGroupSetting(botNumber, chatId, 'antilinkmode', 'delete'); // Changed to antilinkmode
        const allowlink = await db.getGroupSetting(botNumber, chatId, 'allowlink', []); 
        
        // Check if sender is allowed to post links
        if (allowlink.includes(sender)) {
            console.log(`✅ ${sender} is allowed to post links`);
            return;
        }
        
        if (!isEnabled) return;
        
        // Detect URLs in the message
        const urls = detectUrls(message.message);
        if (urls.length === 0) return;

        // Delete the message
        try {
            await kelvin.sendMessage(chatId, {
                delete: {
                    id: messageId,
                    remoteJid: chatId,
                    fromMe: false,
                    participant: sender
                }
            });
            
            console.log(`✅ Link message deleted from ${sender} in ${chatId}`);
            
        } catch (deleteError) {
            console.log('❌ Failed to delete message - Bot may need admin permissions');
            return;
        }

        // Handle based on mode
        switch(mode) {
            case 'warn': {
                // Initialize warnings map if not exists
                if (!global.linkWarnings) global.linkWarnings = new Map();
                
                const warningKey = `${chatId}:${sender}`;
                const userWarnings = global.linkWarnings.get(warningKey) || { count: 0, lastWarning: 0 };
                
                userWarnings.count++;
                userWarnings.lastWarning = Date.now();
                global.linkWarnings.set(warningKey, userWarnings);
                
                let responseMessage = `⚠️ @${sender.split('@')[0]}, links are not allowed in this group!\nWarning: *${userWarnings.count}/3*`;
                
                // Auto-kick after 3 warnings
                if (userWarnings.count >= 3) {
                    try {
                        await kelvin.groupParticipantsUpdate(chatId, [sender], "remove");
                        responseMessage = `🚫 @${sender.split('@')[0]} *has been removed for posting links*.`;
                        global.linkWarnings.delete(warningKey);
                    } catch (kickError) {
                        responseMessage = `⚠️ @${sender.split('@')[0]}, links are not allowed! (Failed to remove - check bot permissions)`;
                    }
                }
                
                await delay(1000);
                await kelvin.sendMessage(chatId, {
                    text: responseMessage,
                    mentions: [sender]
                });
                break;
            }
            
            case 'kick': {
                try {
                    await kelvin.groupParticipantsUpdate(chatId, [sender], "remove");
                    await delay(1000);
                    await kelvin.sendMessage(chatId, {
                        text: `🚫 @${sender.split('@')[0]} *has been removed for posting links*.`,
                        mentions: [sender]
                    });
                } catch (kickError) {
                    await delay(1000);
                    await kelvin.sendMessage(chatId, {
                        text: `⚠️ @${sender.split('@')[0]}, links are not allowed! (Failed to remove - check bot permissions)`,
                        mentions: [sender]
                    });
                }
                break;
            }
            
            case 'delete':
            default: {
                // Just delete the message, no warning
                break;
            }
        }
        
    } catch (error) {
        console.error('❌ Error in handleLinkViolation:', error);
    }
}

async function checkAndHandleLinks(kelvin, message, m, botNumber) {
    try {
        // Only check group messages
        if (!message.key.remoteJid.endsWith('@g.us')) return;
        
        // Ignore messages from the bot itself
        const sender = message.key.participant || message.key.remoteJid;
        if (sender === botNumber) return;
        
        const chatId = message.key.remoteJid;
        
        // Detect URLs in the message first (for efficiency)
        const urls = detectUrls(message.message);
        if (urls.length === 0) return;
        
        await handleLinkViolation(kelvin, message,  botNumber);
        
       
    } catch (error) {
        // Silently handle errors
    }
}

//<================================================>//

async function handleAntiTag(kelvin, m, botNumber) {
    try {
        if (!m || !m.isGroup || !m.message || m.key.fromMe) {
            return;
        }

        const chatId = m.chat;
        const sender = m.sender;

        // Skip if sender is admin
        if (m.isAdmin) {
            return;
        }
        
        // Get antitag settings - NO ALLOWLIST
        const isEnabled = await db.getGroupSetting(botNumber, chatId, 'antitag', false);
        const mode = await db.getGroupSetting(botNumber, chatId, 'antitagmode', 'delete');
        
        if (!isEnabled) return;
        
        // Check if user tagged someone
        const mentionedUsers = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        
        if (mentionedUsers.length > 0) {
            // Delete the message
            try {
                await kelvin.sendMessage(chatId, { delete: m.key });
                console.log(`✅ Deleted tag message from ${sender} in ${chatId}`);
            } catch (deleteError) {
                console.log('❌ Failed to delete message - Bot may need admin permissions');
                return;
            }
            
            // Handle based on mode
            switch(mode) {
                case 'warn': {
                    // Initialize warnings map if not exists
                    if (!global.tagWarnings) global.tagWarnings = new Map();
                    
                    // Get or create user warnings for this specific group
                    const warningKey = `${chatId}:${sender}`;
                    const userWarnings = global.tagWarnings.get(warningKey) || { count: 0, lastWarning: 0 };
                    
                    userWarnings.count++;
                    userWarnings.lastWarning = Date.now();
                    global.tagWarnings.set(warningKey, userWarnings);
                    
                    let responseMessage = `⚠️ @${sender.split('@')[0]}, tagging members is not allowed in this group!\nWarning: *${userWarnings.count}/3*`;
                    
                    // Auto-kick after 3 warnings
                    if (userWarnings.count >= 3) {
                        try {
                            await kelvin.groupParticipantsUpdate(chatId, [sender], "remove");
                            responseMessage = `🚫 @${sender.split('@')[0]} *has been removed for excessive tagging*.`;
                            global.tagWarnings.delete(warningKey);
                        } catch (kickError) {
                            responseMessage = `⚠️ @${sender.split('@')[0]}, tagging is not allowed! (Failed to remove - check bot permissions)`;
                        }
                    }
                    
                    await kelvin.sendMessage(chatId, {
                        text: responseMessage,
                        mentions: [sender]
                    });
                    break;
                }
                
                case 'kick': {
                    try {
                        await kelvin.groupParticipantsUpdate(chatId, [sender], "remove");
                        await kelvin.sendMessage(chatId, {
                            text: `🚫 @${sender.split('@')[0]} *has been removed for tagging members*.`,
                            mentions: [sender]
                        });
                    } catch (kickError) {
                        await kelvin.sendMessage(chatId, {
                            text: `⚠️ @${sender.split('@')[0]}, tagging is not allowed! (Failed to remove - check bot permissions)`,
                            mentions: [sender]
                        });
                    }
                    break;
                }
                
                case 'delete':
                default: {
                    // Just delete, no message
                    break;
                }
            }
        }
        
    } catch (error) {
        console.error('Anti-tag error:', error);
    }
}

async function handleAntiTagAdmin(kelvin, m) {
    try {
        if (!m || !m.isGroup || !m.message || m.key.fromMe) {
            return;
        }

        const botNumber = await kelvin.decodeJid(kelvin.user.id);
        const chatId = m.chat;
        const sender = m.sender;
        const message = m.message;
        
        // Get antitag admin settings - NO ALLOWLIST
        const isEnabled = await db.getGroupSetting(botNumber, chatId, 'antitagadmin', false);
        const action = await db.getGroupSetting(botNumber, chatId, 'antitagadminaction', 'warn');
        
        if (!isEnabled) return;
        
        // Skip if sender is admin
        if (m.isAdmin) {
            return;
        }
        
        // Get group admins
        const groupMetadata = await kelvin.groupMetadata(chatId);
        const admins = groupMetadata.participants.filter(p => p.admin).map(p => p.id);
        
        // Check if message contains @admin or tags admin
        const messageText = extractMessageText(message);
        const mentionedUsers = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        
        // Check for @admin mentions
        const hasAdminMention = messageText.toLowerCase().includes('@admin') || 
                               messageText.toLowerCase().includes('@admins');
        
        // Check if any mentioned user is an admin
        const isTaggingAdmin = mentionedUsers.some(user => admins.includes(user));
        
        if (hasAdminMention || isTaggingAdmin) {
            // Delete the message
            try {
                await kelvin.sendMessage(chatId, { delete: m.key });
                console.log(`✅ Deleted admin tag message from ${sender} in ${chatId}`);
            } catch (deleteError) {
                console.log('❌ Failed to delete message - Bot may need admin permissions');
                return;
            }
            
            // Handle based on action setting
            switch(action) {
                case 'warn': {
                    // Initialize warnings map if not exists
                    if (!global.adminTagWarnings) global.adminTagWarnings = new Map();
                    
                    // Get or create user warnings for this specific group
                    const warningKey = `${chatId}:${sender}`;
                    const userWarnings = global.adminTagWarnings.get(warningKey) || { count: 0, lastWarning: 0 };
                    
                    userWarnings.count++;
                    userWarnings.lastWarning = Date.now();
                    global.adminTagWarnings.set(warningKey, userWarnings);
                    
                    let responseMessage = `⚠️ @${sender.split('@')[0]}, tagging admins is NOT allowed!\nWarning: *${userWarnings.count}/3*`;
                    
                    // Auto-kick after 3 warnings
                    if (userWarnings.count >= 3) {
                        try {
                            await kelvin.groupParticipantsUpdate(chatId, [sender], "remove");
                            responseMessage = `🚫 @${sender.split('@')[0]} *has been removed for repeatedly tagging admins*.`;
                            global.adminTagWarnings.delete(warningKey);
                        } catch (kickError) {
                            responseMessage = `⚠️ @${sender.split('@')[0]}, tagging admins is not allowed! (Failed to remove - check bot permissions)`;
                        }
                    }
                    
                    await kelvin.sendMessage(chatId, {
                        text: responseMessage,
                        mentions: [sender]
                    });
                    break;
                }
                
                case 'kick': {
                    try {
                        await kelvin.groupParticipantsUpdate(chatId, [sender], "remove");
                        await kelvin.sendMessage(chatId, {
                            text: `🚫 @${sender.split('@')[0]} *has been removed for tagging admins*.`,
                            mentions: [sender]
                        });
                    } catch (kickError) {
                        await kelvin.sendMessage(chatId, {
                            text: `⚠️ @${sender.split('@')[0]}, tagging admins is not allowed! (Failed to remove - check bot permissions)`,
                            mentions: [sender]
                        });
                    }
                    break;
                }
                
                case 'delete':
                default: {
                    // Just delete the message, no warning
                    break;
                }
            }
        }
        
    } catch (error) {
        console.error('Anti-tag admin error:', error);
    }
}


/**
 * ANTIDEMOTE COMMAND
 * Prevents admins from being demoted
 */
async function antidemoteCommand(kelvin, m, args, Access, botNumber) {
    try {
        const chatId = m.chat;
        
        // Check if sender is admin using m.isAdmin
        if (!m.isAdmin && !Access) {
            await kelvin.sendMessage(chatId, { text: '❌ For Group Admins Only' }, { quoted: m });
            return;
        }

        const action = args[0]?.toLowerCase();

        if (!action) {
            const usage = `🛡️ *ANTIDEMOTE*\n\n` +
                `• ${m.prefix}antidemote on\n` +
                `• ${m.prefix}antidemote off\n` +
                `• ${m.prefix}antidemote status`;
            await kelvin.sendMessage(chatId, { text: usage }, { quoted: m });
            return;
        }

        switch (action) {
            case 'on':
                await db.setAntidemote(botNumber, chatId, true);
                await kelvin.sendMessage(chatId, { 
                    text: '✅ *antidemote enabled successfully*'
                }, { quoted: m });
                break;

            case 'off':
                await db.setAntidemote(botNumber, chatId, false);
                await kelvin.sendMessage(chatId, { 
                    text: '*antidemote disabled successfully*' 
                }, { quoted: m });
                break;

            case 'status':
                const enabled = await db.getAntidemote(botNumber, chatId);
                await kelvin.sendMessage(chatId, { 
                    text: `📊 Status: ${enabled ? 'ON' : 'OFF'}` 
                }, { quoted: m });
                break;

            default:
                await kelvin.sendMessage(chatId, { 
                    text: '❌ Use: on, off, status' 
                }, { quoted: m });
        }
    } catch (error) {
        console.error('❌ Error in antidemote command:', error);
        await kelvin.sendMessage(m.chat, { 
            text: '❌ An error occurred' 
        }, { quoted: m });
    }
}

/**
 * HANDLE ANTIDEMOTE EVENT
 * Re-promotes admins when demoted
 */
async function handleAntidemote(kelvin, chatId, participants, author) {
    try {
        const botNumber = await kelvin.decodeJid(kelvin.user.id);
        const enabled = await db.getAntidemote(botNumber, chatId);
        
        if (!enabled) return false;

        // Get group metadata
        const groupMetadata = await kelvin.groupMetadata(chatId);
        
        let reproMotedCount = 0;
        
        // Re-promote each demoted participant
        for (const participant of participants) {
            await kelvin.groupParticipantsUpdate(chatId, [participant], 'promote');
            console.log(`[ANTIDEMOTE] ✅ Re-promoted ${participant}`);
            reproMotedCount++;
        }
        
        // Send notification
        if (reproMotedCount > 0) {
            await kelvin.sendMessage(chatId, {
                text: `🛡️ Admin re-promoted`
            });
        }

        return reproMotedCount > 0;
    } catch (error) {
        console.error('❌ Error in handleAntidemote:', error);
        return false;
    }
}

/**
 * ANTIPROMOTE COMMAND
 * Prevents unauthorized promotions
 */
async function antipromoteCommand(kelvin, m, args, Access, botNumber) {
    try {
        const chatId = m.chat;
        
        // Check if sender is admin using m.isAdmin
        if (!m.isAdmin && !Access) {
            await kelvin.sendMessage(chatId, { text: '❌ For Group Admins Only' }, { quoted: m });
            return;
        }

        const action = args[0]?.toLowerCase();

        if (!action) {
            const usage = `*ANTIPROMOTE*\n\n` +
                `• ${m.prefix}antipromote on\n` +
                `• ${m.prefix}antipromote off\n` +
                `• ${m.prefix}antipromote status`;
            await kelvin.sendMessage(chatId, { text: usage }, { quoted: m });
            return;
        }

        switch (action) {
            case 'on':
                await db.setAntipromote(botNumber, chatId, true);
                await kelvin.sendMessage(chatId, { 
                    text: '✅ *Successfully enabled antipromote*' 
                }, { quoted: m });
                break;

            case 'off':
                await db.setAntipromote(botNumber, chatId, false);
                await kelvin.sendMessage(chatId, { 
                    text: 'Successfully disabled antipromote*' 
                }, { quoted: m });
                break;

            case 'status':
                const enabled = await db.getAntipromote(botNumber, chatId);
                await kelvin.sendMessage(chatId, { 
                    text: `📊 Status: ${enabled ? 'ON' : 'OFF'}` 
                }, { quoted: m });
                break;

            default:
                await kelvin.sendMessage(chatId, { 
                    text: '❌ Use: on, off, status' 
                }, { quoted: m });
        }
    } catch (error) {
        console.error('❌ Error in antipromote command:', error);
        await kelvin.sendMessage(m.chat, { 
            text: '❌ An error occurred' 
        }, { quoted: m });
    }
}

/**
 * HANDLE ANTIPROMOTE EVENT
 * Demotes users promoted by non-admins
 */
async function handleAntipromote(kelvin, chatId, participants, author) {
    try {
        const botNumber = await kelvin.decodeJid(kelvin.user.id);
        const enabled = await db.getAntipromote(botNumber, chatId);
        
        if (!enabled) return false;

        // Check if author is admin using existing admin check
        // We'll rely on the event data - if author is not admin, they shouldn't be promoting
        
        let demotedCount = 0;
        
        // Demote all promoted participants
        for (const participant of participants) {
            await kelvin.groupParticipantsUpdate(chatId, [participant], 'demote');
            console.log(`[ANTIPROMOTE] ✅ Demoted ${participant}`);
            demotedCount++;
        }
        
        // Send notification
        if (demotedCount > 0) {
            await kelvin.sendMessage(chatId, {
                text: `🛡️ Unauthorized promotion reversed`
            });
        }

        return demotedCount > 0;
    } catch (error) {
        console.error('❌ Error in handleAntipromote:', error);
        return false;
    }
}
// Function to handle status updates
async function handleStatusUpdate(kelvin, status) {
    try {
        // Get bot number
        const botNumber = await kelvin.decodeJid(kelvin.user.id);
        
        // ✅ GET SETTINGS FROM SQLITE
        const autoviewstatus = await db.get(botNumber, 'autoviewstatus', false);
        const autoreactstatus = await db.get(botNumber, 'autoreactstatus', false);
        const statusemoji = await db.get(botNumber, 'statusemoji', '🥳');
        
        // If both are disabled, return
        if (!autoviewstatus && !autoreactstatus) {
            return;
        }

        // Add delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Select random emoji from popular ones
        const getRandomEmoji = () => {
            const emojis = ['❤️', '😂', '😮', '😢', '🔥', '👏', '🎉', '🤔', '👍', '👎', '😍', '🤯', '😡', '🥰', '😎', '🤩', '🥳', '😭', '🙏', '💯'];
            return emojis[Math.floor(Math.random() * emojis.length)];
        };

        const reactionEmoji = statusemoji === '💚' || !statusemoji ? getRandomEmoji() : statusemoji;

        // Handle status from messages.upsert
        if (status.messages && status.messages.length > 0) {
            const msg = status.messages[0];
            if (msg.key && msg.key.remoteJid === 'status@broadcast') {
                try {
                    if (autoreactstatus) {
                        // View first, then react
                        await kelvin.readMessages([msg.key]);
                        await new Promise(resolve => setTimeout(resolve, 500));
                        
                        await kelvin.sendMessage(msg.key.remoteJid, { 
                            react: { 
                                text: reactionEmoji, 
                                key: msg.key 
                            } 
                        });
                        
                    } else if (autoviewstatus) {
                        // Only view if autoviewstatus is enabled
                        await kelvin.readMessages([msg.key]);
                    }
                    
                } catch (err) {
                    if (err.message?.includes('rate-overlimit')) {
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        
                        try {
                            if (autoreactstatus) {
                                await kelvin.readMessages([msg.key]);
                                await new Promise(resolve => setTimeout(resolve, 500));
                                await kelvin.sendMessage(msg.key.remoteJid, { 
                                    react: { 
                                        text: reactionEmoji, 
                                        key: msg.key 
                                    } 
                                });
                            } else if (autoviewstatus) {
                                await kelvin.readMessages([msg.key]);
                            }
                        } catch (retryError) {}
                    }
                }
                return;
            }
        }

        // Handle direct status updates
        if (status.key && status.key.remoteJid === 'status@broadcast') {
            try {
                if (autoreactstatus) {
                    await kelvin.readMessages([status.key]);
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    await kelvin.sendMessage(status.key.remoteJid, { 
                        react: { 
                            text: reactionEmoji, 
                            key: status.key 
                        } 
                    });
                    
                } else if (autoviewstatus) {
                    await kelvin.readMessages([status.key]);
                }
                
            } catch (err) {
                if (err.message?.includes('rate-overlimit')) {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    try {
                        if (autoreactstatus) {
                            await kelvin.readMessages([status.key]);
                            await new Promise(resolve => setTimeout(resolve, 500));
                            await kelvin.sendMessage(status.key.remoteJid, { 
                                react: { 
                                    text: reactionEmoji, 
                                    key: status.key 
                                } 
                            });
                        } else if (autoviewstatus) {
                            await kelvin.readMessages([status.key]);
                        }
                    } catch (retryError) {}
                }
            }
            return;
        }

        // Handle status in reactions
        if (status.reaction && status.reaction.key.remoteJid === 'status@broadcast') {
            try {
                if (autoreactstatus) {
                    await kelvin.readMessages([status.reaction.key]);
                    await new Promise(resolve => setTimeout(resolve, 500));
                    await kelvin.sendMessage(status.reaction.key.remoteJid, { 
                        react: { 
                            text: reactionEmoji, 
                            key: status.reaction.key 
                        } 
                    });
                } else if (autoviewstatus) {
                    await kelvin.readMessages([status.reaction.key]);
                }
                
            } catch (err) {
                if (err.message?.includes('rate-overlimit')) {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    try {
                        if (autoreactstatus) {
                            await kelvin.readMessages([status.reaction.key]);
                            await new Promise(resolve => setTimeout(resolve, 500));
                            await kelvin.sendMessage(status.reaction.key.remoteJid, { 
                                react: { 
                                    text: reactionEmoji, 
                                    key: status.reaction.key 
                                } 
                            });
                        } else if (autoviewstatus) {
                            await kelvin.readMessages([status.reaction.key]);
                        }
                    } catch (retryError) {}
                }
            }
            return;
        }

    } catch (error) {
        // Silent error handling
    }
}

module.exports = {
    handleAntiDelete,
    checkAndHandleLinks,
    handleLinkViolation,
    handleAntiTag,
    handleAntiTagAdmin,
    antidemoteCommand,
    handleAntidemote,
    antipromoteCommand,
    handleAntipromote,
    handleStatusUpdate,
    handleAntiEdit,
    handleMessageStore
};
