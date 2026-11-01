// KelvinPlugins/owner.js
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');
const { exec } = require('child_process');
const util = require('util');
const { downloadContentFromMessage,getContentType } = require('@whiskeysockets/baileys');
const https = require('https');
const settings = require('../start/Core/developer');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function downloadFile(url, dest, visited = new Set()) {
    return new Promise((resolve, reject) => {
        if (visited.has(url) || visited.size > 5) return reject(new Error('Too many redirects'));
        visited.add(url);

        const client = url.startsWith('https://') ? https : require('http');
        const req = client.get(url, { headers: { 'User-Agent': 'JUNE-X-Updater/1.0' } }, res => {
            if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
                const nextUrl = new URL(res.headers.location, url).toString();
                res.resume();
                return downloadFile(nextUrl, dest, visited).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));

            const file = fs.createWriteStream(dest);
            res.pipe(file);
            file.on('finish', () => file.close(resolve));
            file.on('error', err => {
                fs.unlink(dest, () => reject(err));
            });
        });
        req.on('error', err => fs.unlink(dest, () => reject(err)));
    });
}

async function extractZip(zipPath, outDir) {
    if (process.platform === 'win32') {
        await run(`powershell -NoProfile -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${outDir}' -Force"`);
        return;
    }
    for (const tool of ['unzip', '7z', 'busybox unzip']) {
        try {
            await run(`command -v ${tool.split(' ')[0]}`);
            await run(`${tool} -o '${zipPath}' -d '${outDir}'`);
            return;
        } catch {}
    }
    throw new Error("No unzip tool found");
}

function copyRecursive(src, dest, ignore = [], relative = '', outList = []) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
        if (ignore.includes(entry)) continue;
        const s = path.join(src, entry);
        const d = path.join(dest, entry);
        const stat = fs.lstatSync(s);

        if (stat.isDirectory()) {
            copyRecursive(s, d, ignore, path.join(relative, entry), outList);
        } else {
            fs.mkdirSync(path.dirname(d), { recursive: true });
            fs.copyFileSync(s, d);
            outList.push(path.join(relative, entry).replace(/\\/g, '/'));
        }
    }
}

async function updateViaZip(zipUrl) {
    if (!zipUrl) throw new Error('No ZIP URL configured.');

    const tmpDir = path.join(process.cwd(), 'tmp');
    fs.mkdirSync(tmpDir, { recursive: true });

    const zipPath = path.join(tmpDir, 'update.zip');
    await downloadFile(zipUrl, zipPath);

    const extractTo = path.join(tmpDir, 'update_extract');
    fs.rmSync(extractTo, { recursive: true, force: true });
    await extractZip(zipPath, extractTo);

    const entries = fs.readdirSync(extractTo);
    const root = entries.length === 1 && fs.lstatSync(path.join(extractTo, entries[0])).isDirectory()
        ? path.join(extractTo, entries[0])
        : extractTo;

    const ignore = ['node_modules', '.git', 'sessions', 'tmp', 'temp', 'data', 'baileys_store.json', 'creds.json'];
    const copied = [];
    copyRecursive(root, process.cwd(), ignore, '', copied);

    fs.rmSync(extractTo, { recursive: true, force: true });
    fs.rmSync(zipPath, { force: true });

    return { copiedFiles: copied };
}

function run(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, { windowsHide: true }, (err, stdout, stderr) => {
            if (err) return reject(new Error(stderr || stdout || err.message));
            resolve(stdout.toString().trim());
        });
    });
}

module.exports = [

{
        command: ['getpp', 'pp', 'profilepic', 'getprofile'],
        operate: async ({ supreme, m, reply, quoted, Access, mess }) => {
            if (!Access) return reply(global.mess.owner);
            
            if (!quoted) {
                // React with 📷 even if no user is quoted
                await supreme.sendMessage(m.chat, {
                    react: {
                        text: "📷",
                        key: m.key
                    }
                });
                return reply('Reply to a user to get their profile picture.');
            }

            // React with 📷 emoji to the command message
            await supreme.sendMessage(m.chat, {
                react: {
                    text: "📷",
                    key: m.key
                }
            });

            const userId = quoted.sender;

            try {
                const ppUrl = await supreme.profilePictureUrl(userId, 'image');

                await supreme.sendMessage(m.chat, 
                    { 
                        image: { url: ppUrl }, 
                        caption: `⌘ *Profile Picture of:* @${userId.split('@')[0]}`,
                        mentions: [ userId ]
                    }, { quoted: m }); 
            } catch (error) {
                console.error('Error getting profile picture:', error);
                await supreme.sendMessage(m.chat, { 
                    image: { url: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png?q=60' }, 
                    caption: '⚠️ No profile picture found.' 
                }, { quoted: m });
            }
        }
    },
{
    command: ['mode', 'public', 'private'],
    operate: async ({ supreme, m, reply, prefix, args, db, botNumber, Access }) => {
        if (!Access) return reply(global.mess.owner);
        
        const subcommand = args[0]?.toLowerCase();
        
        if (!subcommand) {
            const currentMode = supreme.public ? 'Public 🌍' : 'Private 🔒';
            const savedMode = await db.get(botNumber, 'mode', 'public');
            
            return reply(`*Bot Mode Settings*

Current: *${currentMode}*
Saved: ${savedMode}

Usage:
• ${prefix}mode public - Set bot to PUBLIC mode
• ${prefix}mode private - Set bot to PRIVATE mode
• ${prefix}mode status - Check current mode

📌 Changes persist after bot restart`);
        }
        
        switch(subcommand) {
            case 'public': {
                supreme.public = true;
                await db.set(botNumber, 'mode', 'public');
                
                reply(`✅ Bot set to public mode successfully.`);
                break;
            }
            
            case 'private': {
                supreme.public = false;
                await db.set(botNumber, 'mode', 'private');
                
                reply(`✅ Bot set to private mode successfully.`);
                break;
            }
            
            case 'status': {
                const currentMode = supreme.public ? 'Public 🌍' : 'Private 🔒';
                const savedMode = await db.get(botNumber, 'mode', 'public');
                
                reply(`*Bot Mode Status*

• Current Mode: *${currentMode}*
• Saved Setting: ${savedMode}
• Effective: ${supreme.public ? '✅ PUBLIC' : '🔒 PRIVATE'}

Use ${prefix}mode public/private to change`);
                break;
            }
            
            default: {
                reply(`❌ Invalid option. Use ${prefix}mode to see options`);
                break;
            }
        }
    }
},
    {
        command: ['toviewonce', 'tovo', 'tovv', 'vv'],
        operate: async ({ supreme, m, reply, quoted, mime, Access, mess }) => {
        if (!Access) return reply(global.mess.owner) 
    try {
        if (!m.quoted) return reply('❌ Reply to a ViewOnce Video, Image, or Audio.');

        const quotedMessage = m.msg.contextInfo.quotedMessage;
        if (!quotedMessage) return reply('❌ No media found in the quoted message.');

        if (quotedMessage.imageMessage) {
            let imageCaption = quotedMessage.imageMessage.caption || '';
            let imageUrl = await supreme.downloadAndSaveMediaMessage(quotedMessage.imageMessage);
            await supreme.sendMessage(m.chat, { image: { url: imageUrl }, caption: imageCaption });
        }

        if (quotedMessage.videoMessage) {
            let videoCaption = quotedMessage.videoMessage.caption || '';
            let videoUrl = await supreme.downloadAndSaveMediaMessage(quotedMessage.videoMessage);
            await supreme.sendMessage(m.chat, { video: { url: videoUrl }, caption: videoCaption });
        }

        if (quotedMessage.audioMessage) {
            let audioUrl = await supreme.downloadAndSaveMediaMessage(quotedMessage.audioMessage);
            await supreme.sendMessage(m.chat, { audio: { url: audioUrl }, mimetype: 'audio/mp4' });
        }

    } catch (error) {
        console.error('Error processing vv command:', error);
        reply('An error occurred while processing your request.');
    }
    
  }
},
{
    command: ['block', 'blockuser'],
    operate: async ({ supreme, m, reply, quoted, text, mentionedJid, Access, mess }) => {
          if (!Access) return reply(global.mess.owner);
        
        if (!m.quoted && !mentionedJid[0] && !text) return reply("Reply to a message or mention/user ID to block");
        
        const userId = mentionedJid[0] || quoted?.sender || text.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
        
        try {
            // React with 🚫 emoji
            await supreme.sendMessage(m.chat, {
                react: {
                    text: "🚫",
                    key: m.key
                }
            });
            
            // Block the user
            await supreme.updateBlockStatus(userId, "block");
            reply(`✅ Successfully blocked @${userId.split('@')[0]}`);
        } catch (error) {
            console.error('Error blocking user:', error);
            reply(`Failed to block user: ${error.message}`);
        }
    }
},
{
    command: ['unblock', 'unblockuser'],
    operate: async ({ supreme, m, reply, quoted, text, mentionedJid, Access, mess }) => {
          if (!Access) return reply(global.mess.owner);
        
        if (!m.quoted && !mentionedJid[0] && !text) return reply("Reply to a message or mention/user ID to unblock");
        
        const userId = mentionedJid[0] || quoted?.sender || text.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
        
        try {
            // React with ✅ emoji
            await supreme.sendMessage(m.chat, {
                react: {
                    text: "✅",
                    key: m.key
                }
            });
            
            // Unblock the user
            await supreme.updateBlockStatus(userId, "unblock");
            reply(`✅ Successfully unblocked @${userId.split('@')[0]}`);
        } catch (error) {
            console.error('Error unblocking user:', error);
            reply(`❌ Failed to unblock user: ${error.message}`);
        }
    }
},
{
    command: ['unblockall'],
    operate: async ({ supreme, m, reply, Access, mess }) => {
          if (!Access) return reply(global.mess.owner);
        
        try {
            const blockedList = await supreme.fetchBlocklist();
            if (!blockedList.length) return reply("✅ No blocked contacts to unblock.");
            
            for (const user of blockedList) {
                await supreme.updateBlockStatus(user, "unblock");
            }
            
            reply(`✅ Successfully unblocked *${blockedList.length}* contacts.`);
        } catch (error) {
            console.error('Error unblocking all contacts:', error);
            reply("⚠️ Failed to unblock all contacts.");
        }
    }
},
{
    command: ['listblocked', 'blockedlist', 'showblocked'],
    operate: async ({ supreme, m, reply, Access, mess }) => {
          if (!Access) return reply(global.mess.owner);
        
        try {
            const blockedList = await supreme.fetchBlocklist();
            
            if (!blockedList.length) {
                return reply('✅ No contacts are currently blocked.');
            }
            
            // React with 🚫 emoji
            await supreme.sendMessage(m.chat, {
                react: {
                    text: "🚫",
                    key: m.key
                }
            });
            
            let blockedUsers = blockedList.map((user, index) => `🔹 *${index + 1}.* @${user.split('@')[0]}`).join('\n');
            
            await supreme.sendMessage(m.chat, {
                text: `🚫 *Blocked Contacts:*\n\n${blockedUsers}`,
                mentions: blockedList
            }, { quoted: m });
            
        } catch (error) {
            console.error('Error fetching blocked contacts:', error);
            reply('⚠️ Unable to fetch blocked contacts.');
        }
    }
},
{
    command: [ 'delpp', 'removepfp', 'deleteprofilepic'],
    operate: async ({ supreme, m, reply, Access, mess }) => {
          if (!Access) return reply(global.mess.owner);
        
        try {
            
            await supreme.removeProfilePicture(supreme.user.id);
            reply("✅ Successfully deleted profile picture");
        } catch (error) {
            console.error('Error removing profile picture:', error);
            reply("Failed to delete profile picture");
        }
    }
},
{
    command: ['creategroup', 'creategc'],
    operate: async ({ supreme, m, reply, args, prefix, command, Access }) => {
          if (!Access) return reply(global.mess.owner);
        
        if (!args.join(" ")) return reply(`*Example: ${prefix + command} Group Name*`);
        
        try {
            // Create the group
            const createdGroup = await supreme.groupCreate(args.join(" "), []);
            
            // Get the group invite link
            const inviteCode = await supreme.groupInviteCode(createdGroup.id);
            
            // Format the creation time
            const creationTime = moment(createdGroup.creation * 1000)
                .tz("Asia/Kolkata")
                .format("DD/MM/YYYY HH:mm:ss");
            
            // Create message text
            const messageText = `     「 Create Group 」

▸ Name : ${createdGroup.subject}
▸ Owner : @${createdGroup.owner.split("@")[0]}
▸ Creation : ${creationTime}

https://chat.whatsapp.com/${inviteCode}`;
            
            // Send the message
            await supreme.sendMessage(
                m.chat,
                { 
                    text: messageText, 
                    mentions: await supreme.parseMention(messageText)
                },
                { quoted: m }
            );
            
        } catch (error) {
            console.error('Create group error:', error);
            reply('✅ Group created successfully!');
        }
    }
},
{
    command: ['restart', 'reboot'],
    operate: async ({ supreme, m, reply, Access, botNumber, pushname }) => {
          if (!Access) return reply(global.mess.owner);
        
        try {
            const botName = `${global.botname}`;
            
            await reply(`*Restarting ${botName} Bot...*\n\nPlease wait 10-15 seconds for the bot to restart.`);
            
            // A small delay to ensure the message is sent
            await sleep(2000);
            
            // Log the restart action
            console.log(chalk.yellow.bold(`Bot restart initiated by ${pushname} (${m.sender})`));
            
            // Send a goodbye message
            await supreme.sendMessage(m.chat, {
                text: '*Bot is restarting...*\n\nPlease wait a moment while I restart.',
                mentions: [m.sender]
            });
            
    
            await sleep(1000);
            
            // Close the connection gracefully if available
            if (supreme && typeof supreme.end === 'function') {
                await supreme.end();
            }
            
            // Restart the process
            process.exit(0);
            
        } catch (error) {
            console.error('Error during restart:', error);
            reply('❌ *Failed to restart bot.* Please restart manually.');
        }
    }
},
{
    command: ['join', 'joingroup'],
    operate: async ({ supreme, m, reply, prefix, args, Access, text, isUrl }) => {
          if (!Access) return reply(global.mess.owner);
        
        if (!text) return reply("Enter group link");
        if (!isUrl(args[0]) && !args[0].includes("whatsapp.com")) return reply("Invalid link");

        try {
            const link = args[0].split("https://chat.whatsapp.com/")[1];
            await supreme.groupAcceptInvite(link);
            reply("✅ Joined successfully");
        } catch (error) {
            console.error(error);
            reply("❌ Failed to join group. Reason: " + (error.message || "Invalid link or bot is banned"));
        }
    }
},
{
    command: ['groupjids', 'gjids', 'allgroups', 'groupslist'],
    operate: async ({ supreme, m, reply, prefix, args, Access, text }) => {
          if (!Access) return reply(global.mess.owner);
        
        reply("📝 Fetching all groups...");
        
        try {
            const groups = await supreme.groupFetchAllParticipating();
            const groupList = Object.keys(groups);
            
            if (groupList.length === 0) {
                return reply("No groups found. The bot is not in any groups.");
            }
            
            let groupInfo = `📊 *TOTAL GROUPS:* ${groupList.length}\n\n`;
            
            for (let i = 0; i < groupList.length; i++) {
                const groupId = groupList[i];
                const group = groups[groupId];
                const groupName = group.subject || "Unnamed Group";
                const participants = group.participants ? group.participants.length : 0;
                
                groupInfo += `*${i + 1}. ${groupName}*\n`;
                groupInfo += `   👥 Members: ${participants}\n`;
                groupInfo += `   🆔 JID: ${groupId}\n\n`;
            }
            
            // If message is too long, split it
            if (groupInfo.length > 4000) {
                const chunks = groupInfo.match(/.{1,4000}/g);
                for (let i = 0; i < chunks.length; i++) {
                    await reply(`📝 *GROUP LIST (Part ${i + 1}/${chunks.length})*\n\n${chunks[i]}`);
                    await sleep(500);
                }
            } else {
                reply(groupInfo);
            }
            
        } catch (error) {
            console.error(error);
            reply("Failed to fetch groups: " + error.message);
        }
    }
},
{
    command: ['request'],
    operate: async ({ supreme, m, reply, prefix, args, Access, text, sender, pushname }) => {
          if (!Access) return reply(global.mess.owner);
        
        if (!text) return reply(`Example: ${prefix}request I would like a new feature (specify) to be added.`);

        const requestMsg = `
*REQUEST*

*User*: @${sender.split("@")[0]}
*Request*: ${text}
        `;

        const confirmationMsg = `
Hi ${pushname},

Your request has been forwarded to my developer.
Please wait for a reply.

*Details:*
${requestMsg}
        `;

        await supreme.sendMessage("254734376878@s.whatsapp.net", { text: requestMsg, mentions: [sender] }, { quoted: m });
        await supreme.sendMessage(m.chat, { text: confirmationMsg, mentions: [sender] }, { quoted: m });
    }
},
{
    command: ['reportbug'],
    operate: async ({ supreme, m, reply, prefix, args, Access, text, sender, pushname }) => {
          if (!Access) return reply(global.mess.owner);
        
        if (!text) return reply(`Example: ${prefix}reportbug Hey, play command isn't working`);

        const bugReportMsg = `
*BUG REPORT*

*User*: @${sender.split("@")[0]}
*Issue*: ${text}
        `;

        const confirmationMsg = `
Hi ${pushname},

Your bug report has been forwarded to my developer.
Please wait for a reply.

*Details:*
${bugReportMsg}
        `;

        await supreme.sendMessage("254734376878@s.whatsapp.net", { text: bugReportMsg, mentions: [sender] }, { quoted: m });
        await supreme.sendMessage(m.chat, { text: confirmationMsg, mentions: [sender] }, { quoted: m });
    }
},
{
    command: ['delete', 'del'],
    operate: async ({ supreme, m, reply, prefix, args, Access, quoted }) => {
          if (!Access) return reply(global.mess.owner);
        
        if (!quoted) return reply(`*Please reply to a message*`);

        try {
            // Delete the quoted message
            await supreme.sendMessage(m.chat, {
                delete: {
                    remoteJid: quoted.fakeObj.key.remoteJid,
                    fromMe: quoted.fakeObj.key.fromMe,
                    id: quoted.fakeObj.key.id,
                    participant: quoted.fakeObj.participant,
                }
            });

            // Delete the command message
            await supreme.sendMessage(m.chat, {
                delete: {
                    remoteJid: m.key.remoteJid,
                    fromMe: m.key.fromMe,
                    id: m.key.id,
                    participant: m.key.participant,
                }
            });

        } catch (err) {
            console.error(err);
            reply("⚠️ Failed to delete message.");
        }
    }
},
{
    command: ['online'],
    operate: async ({ supreme, m, reply, prefix, args, Access, text, botNumber }) => {
          if (!Access) return reply(global.mess.owner);
        if (!text) return reply(`Options: all/match_last_seen\nExample: ${prefix + command} all`);

        const validOptions = ["all", "match_last_seen"];
        if (!validOptions.includes(args[0])) return reply("Invalid option");

        await supreme.updateOnlinePrivacy(text);
        await reply(global.mess.done);
    }
},
{
    command: ['readreceipts'],
    operate: async ({ supreme, m, reply, prefix, args, Access, text }) => {
          if (!Access) return reply(global.mess.owner);
        if (!text) return reply(`Options: all/none\nExample: ${prefix + command} all`);

        const validOptions = ["all", "none"];
        if (!validOptions.includes(args[0])) return reply("Invalid option");

        await supreme.updateReadReceiptsPrivacy(text);
        await reply(global.mess.done);
    }
},
{
    command: ['setpp'],
    operate: async ({ supreme, m, reply, prefix, args, Access, quoted, mime, botNumber, getBuffer }) => {
          if (!Access) return reply(global.mess.owner);
        if (!quoted) return reply(`*Send or reply to an image With captions ${prefix}setpp*`);
        if (!/image/.test(mime)) return reply(`*Send or reply to an image With captions ${prefix}setpp*`);
        if (/webp/.test(mime)) return reply(`*Send or reply to an image With captions ${prefix}setpp*`);

        const fs = require('fs');
        const medis = await supreme.downloadAndSaveMediaMessage(quoted, "ppbot.jpeg");

        if (args[0] === "full") {
            const generateFullProfilePic = async (imagePath) => {
                const Jimp = require('jimp');
                const jimp = await Jimp.read(imagePath);
                const min = jimp.getWidth();
                const max = jimp.getHeight();
                const cropped = jimp.crop(0, 0, min, max);
                return {
                    img: await cropped.scaleToFit(720, 720).getBufferAsync(Jimp.MIME_JPEG)
                };
            };
            
            const { img } = await generateFullProfilePic(medis);
            await supreme.query({
                tag: "iq",
                attrs: {
                    to: botNumber,
                    type: "set",
                    xmlns: "w:profile:picture",
                },
                content: [
                    {
                        tag: "picture",
                        attrs: {
                            type: "image",
                        },
                        content: img,
                    },
                ],
            });
            fs.unlinkSync(medis);
            reply(global.mess.done);
        } else {
            await supreme.updateProfilePicture(botNumber, {
                url: medis,
            });
            fs.unlinkSync(medis);
            reply(global.mess.done);
        }
    }
},
{
    command: ['readreceipt', 'readprivacy'],
    operate: async ({ supreme, m, reply, prefix, args, Access, text }) => {
          if (!Access) return reply(global.mess.owner);
        if (!text) return reply(`*Usage:* ${prefix}readprivacy [option]\n\n*Options:* all, contacts, none\n*Example:* ${prefix}readprivacy all`);

        const validOptions = ["all", "contacts", "none"];
        const option = args[0].toLowerCase();

        if (!validOptions.includes(option)) {
            return reply(`*Invalid option!*\n\nValid options: ${validOptions.join(', ')}\nExample: ${prefix}readprivacy all`);
        }

        try {
            await supreme.updateReadReceiptsPrivacy(option);
            
            const getReadReceiptDescription = (opt) => {
                const descriptions = {
                    all: "• Everyone can see your read receipts\n• Shows blue ticks for all messages",
                    contacts: "• Only your contacts can see read receipts\n• Others see single gray ticks",
                    none: "• No one can see your read receipts\n• Shows only single gray ticks for everyone"
                };
                return descriptions[opt] || "Unknown option";
            };
            
            reply(`✅ *Read receipts privacy set to:* ${option.toUpperCase()}\n\n*What this means:*\n${getReadReceiptDescription(option)}`);
        } catch (error) {
            console.error('Error setting read receipts privacy:', error);
            reply('*Failed to update read receipts settings.* Please try again.');
        }
    }
},
{
    command: ['deletepp', 'delpp'],
    operate: async ({ supreme, m, reply, Access }) => {
          if (!Access) return reply(global.mess.owner);
        
        try {
            await supreme.removeProfilePicture(supreme.user.id);
            reply("*Successfully deleted profile pic*");
        } catch (error) {
            console.error(error);
            reply("⚠️ Failed to delete profile picture.");
        }
    }
},
{
    command: ['setprefix'],
    operate: async ({ supreme, m, reply, args, prefix, botNumber, db, Access, mess }) => {
       if (!Access) return reply(global.mess.owner);
    
    const newPrefix = args[0];
    if (!newPrefix) {
        const currentPrefix = await db.get(botNumber, 'prefix', '.');
        return reply(`*📝 PREFIX SETTINGS*\n\nCurrent prefix: *${currentPrefix}*\n\nUsage: ${currentPrefix}setprefix <new prefix>\nExample: ${currentPrefix}setprefix !`);
    }
    
    await db.set(botNumber, 'prefix', newPrefix);
    reply(`✅ Prefix has been changed to: *${newPrefix}*`);
   }
},
{
    command: ['setownername'],
    operate: async ({ supreme, m, reply, args, text, prefix, botNumber, db, Access, mess }) => {
         if (!Access) return reply(mess.owner);
    
    if (!text) {
        const currentName = await db.get(botNumber, 'ownername', 'Not set');
        return reply(`*SET OWNER NAME*\n\n*Usage:* ${prefix}setownername [new owner name]\n*Example:* ${prefix}setownername Kelvin Tech\n\n*Current owner name:* ${currentName}`);
    }

    try {
        // Validate name length
        if (text.length > 30) {
            return reply('❌ *Owner name too long!* Maximum 30 characters allowed.');
        }
        
        if (text.length < 2) {
            return reply('❌ *Owner name too short!* Minimum 2 characters required.');
        }

        // Set the new owner name in SQLite
        await db.set(botNumber, 'ownername', text.trim());

        // Update global for current session
        global.ownername = text.trim();

        reply(`✅ Owner name set to: ${text.trim()}`);

    } catch (error) {
        console.error('Error in setownername command:', error);
        reply('❌ *Failed to update owner name.* Please try again.');
    }
  }
},
{
    command: ['setownernumber'],
    operate: async ({ supreme, m, reply, args, prefix, command, db, botNumber, Access, mess }) => {
          if (!Access) return reply(mess.owner);
    
    if (args.length < 1) return reply(`Example: ${prefix + command} 254107065646\n\nThis will change the owner's number in the database`);

    // Join all arguments to capture the full number including spaces
    let fullInput = args.join(' ');
    let newNumber = fullInput.replace(/\D/g, '');

    console.log(`Input: ${fullInput}, Extracted Number: ${newNumber}`); // Debug log

    if (newNumber.startsWith('0')) {
        return reply("⚠️ Phone numbers should not start with *0*. Use the full international format (e.g., *254...* instead of *07...*)");
    }

    if (newNumber.length < 5 || newNumber.length > 15) {
        return reply(`⚠️ Please provide a valid phone number (5-15 digits)\n\nYou provided: ${newNumber.length} digits: ${newNumber}`);
    }

    // Store the old number for comparison
    const oldNumber = await db.get(botNumber, 'ownernumber', 'Not set');

    // Update owner number in SQLite
    await db.set(botNumber, 'ownernumber', newNumber);

    // Update owner array in database
    const newOwnerJid = newNumber + "@s.whatsapp.net";
    const currentOwners = await db.get(botNumber, 'owners', []);
    
    // Add new owner to owners list if not already there
    if (!currentOwners.includes(newOwnerJid)) {
        currentOwners.push(newOwnerJid);
        await db.set(botNumber, 'owners', currentOwners);
    }

    // Update global for current session
    global.owner = [newOwnerJid];

    // Add to sudo if not already there
    const currentSudo = await db.getSudo(botNumber);
    if (!currentSudo.includes(newOwnerJid)) {
        await db.addSudo(botNumber, newOwnerJid);
    }

    reply(`✅ Owner number set to: ${newNumber}`);
  }
},
{
    command: ['removeowner', 'delsudo'],
    operate: async ({ supreme, m, reply, text, mentionedJid, quoted, db, Access, mess }) => {
         if (!Access) return reply(global.mess.owner);
    
    const user = m.mentionedJid[0] || args[0];
    if (!user) return reply('Mention user or provide JID');
    
    // Get current owners
    let owners = await db.get(botNumber, 'owners', []);
    
    // Normalize the JID
    const normalizedJid = user.includes('@s.whatsapp.net') ? user : user + '@s.whatsapp.net';
    
    const index = owners.indexOf(normalizedJid);
    if (index > -1) {
        owners.splice(index, 1);
        await db.set(botNumber, 'owners', owners);
        reply(`✅ @${normalizedJid.split('@')[0]} removed from owners list!`, { mentions: [normalizedJid] });
    } else {
        reply(`❌ User is not in owners list!`);
    }
  }
},
{
    command: ['addowner', 'addsudo'],
    operate: async ({ supreme, m, reply, text, mentionedJid, db, quoted, botNumber, Access, mess, }) => {
        if (!Access) return reply(mess.owner);
    
    const user = m.mentionedJid[0] || args[0];
    if (!user) return reply('❌ Mention user or provide JID');
    
    // Get current owners
    let owners = await db.get(botNumber, 'owners', []);
    
    // Normalize the JID
    const normalizedJid = user.includes('@s.whatsapp.net') ? user : user + '@s.whatsapp.net';
    
    if (!owners.includes(normalizedJid)) {
        owners.push(normalizedJid);
        await db.set(botNumber, 'owners', owners);
        reply(`✅ @${normalizedJid.split('@')[0]} added to owners list!`, { mentions: [normalizedJid] });
    } else {
        reply(`❌ User is already an owner!`);
    }
  }
},
{
    command: ['listowners', 'listsudo'],
    operate: async ({ supreme, m, reply, botNumber, db, Access, mess, }) => {
      const owners = await db.get(botNumber, 'owners', []);
    const sudo = await db.getSudo(botNumber);
    
    if (owners.length === 0 && sudo.length === 0) {
        return reply('📋 No owners or sudo users found.');
    }
    
    let message = `*AUTHORIZED USERS*\n\n`;
    
    if (owners.length > 0) {
        message += `*📋 Owners:*\n`;
        owners.forEach((jid, i) => {
            message += `${i+1}. @${jid.split('@')[0]}\n`;
        });
        message += `\n`;
    }
    
    if (sudo.length > 0) {
        message += `*Sudo Users:*\n`;
        sudo.forEach((jid, i) => {
            message += `${i+1}. @${jid.split('@')[0]}\n`;
        });
    }
    
    await supreme.sendMessage(m.chat, {
        text: message,
        mentions: [...owners, ...sudo]
    }, { quoted: m });
    }
},
{
    command: ['settings', 'config'],
    operate: async ({ supreme, m, reply, botNumber, db, Access, mess }) => {
        if (!Access) return reply(global.mess.owner);
    
    // Fetch all settings from SQLite
    const [
        prefix,
        alwaysonline,
        antidelete,
        antiedit,
        anticall,
        antilinkdelete,
        antilinkaction,
        antibadword,
        antibadwordaction,
        antitag,
        antitagaction,
        autorecording,
        autoTyping,
        autoread,
        autoreact,
        AI_CHAT,
        autoviewstatus,
        autoreactstatus,
        statusemoji,
        welcome,
        adminevent
    ] = await Promise.all([
        db.get(botNumber, 'prefix', '.'),
        db.get(botNumber, 'alwaysonline', false),
        db.get(botNumber, 'antidelete', 'off'),
        db.get(botNumber, 'antiedit', 'off'),
        db.get(botNumber, 'anticall', 'off'),
        db.get(botNumber, 'antilink', false),
        db.get(botNumber, 'antilinkaction', 'delete'),
        db.get(botNumber, 'antibadword', false),
        db.get(botNumber, 'antibadwordaction', 'delete'),
        db.get(botNumber, 'antitag', false),
        db.get(botNumber, 'antitagaction', 'delete'),
        db.get(botNumber, 'autorecording', false),
        db.get(botNumber, 'autoTyping', false),
        db.get(botNumber, 'autoread', false),
        db.get(botNumber, 'autoreact', false),
        db.get(botNumber, 'AI_CHAT', false),
        db.get(botNumber, 'autoviewstatus', false),
        db.get(botNumber, 'autoreactstatus', false),
        db.get(botNumber, 'statusemoji', '💚'),
        db.get(botNumber, 'welcome', false),
        db.get(botNumber, 'adminevent', false)
    ]);

    let settingsMsg = `*📊 BOT SETTINGS STATUS*\n\n`;
    settingsMsg += `🔸 Prefix: ${prefix}\n`;
    settingsMsg += `🔸 Always Online: ${alwaysonline ? 'True' : 'False'}\n`;
    settingsMsg += `🔸 Anti-Delete: ${antidelete !== 'off' ? 'True (' + antidelete + ')' : 'False'}\n`;
    settingsMsg += `🔸 Anti-Edit: ${antiedit !== 'off' ? 'True (' + antiedit + ')' : 'False'}\n`;
    settingsMsg += `🔸 Anti-Call: ${anticall !== 'off' ? 'True (' + anticall + ')' : 'False'}\n`;
    settingsMsg += `🔸 Anti-Link: ${antilinkdelete ? 'True (' + antilinkaction + ')' : 'False'}\n`;
    settingsMsg += `🔸 Anti-Badword: ${antibadword ? 'True (' + antibadwordaction + ')' : 'False'}\n`;
    settingsMsg += `🔸 Anti-Tag: ${antitag ? 'True (' + antitagaction + ')' : 'False'}\n`;
    settingsMsg += `🔸 Auto-Recording: ${autorecording ? 'True' : 'False'}\n`;
    settingsMsg += `🔸 Auto-Typing: ${autoTyping ? 'True' : 'False'}\n`;
    settingsMsg += `🔸 Auto-Read: ${autoread ? 'True' : 'False'}\n`;
    settingsMsg += `🔸 Auto-React: ${autoreact ? 'True' : 'False'}\n`;
    settingsMsg += `🔸 AI Chatbot: ${AI_CHAT ? 'True' : 'False'}\n`;
    settingsMsg += `🔸 Auto-View Status: ${autoviewstatus ? 'True' : 'False'}\n`;
    settingsMsg += `🔸 Auto-React Status: ${autoreactstatus ? 'True (' + statusemoji + ')' : 'False'}\n`;
    settingsMsg += `🔸 Welcome Message: ${welcome ? 'True' : 'False'}\n`;
    settingsMsg += `🔸 Admin Events: ${adminevent ? 'True' : 'False'}`;
    
    reply(settingsMsg);
    }
},
{
        command: ['tostatus'],
        operate: async ({ supreme, m, reply, Access, mess }) => {
        try {
    if (!Access) return reply(global.mess.owner);

    const quoted = m.quoted || m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted || !quoted.message) {
      return reply("⚠️ Please reply to an image, video, or audio message to post to status.");
    }

    const msg = quoted.message || quoted;
    const type = getContentType(msg);
    const mediaMsg = msg[type];

    if (!["imageMessage", "videoMessage", "audioMessage"].includes(type)) {
      return reply("*Unsupported media. Reply to image, video, or audio only.*");
    }

    // Download content
    const stream = await downloadContentFromMessage(mediaMsg, type.replace("Message", "").toLowerCase());
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

    // Caption fallback
    const caption = mediaMsg?.caption || '';

    // Compose message
    const content =
      type === "imageMessage"
        ? { image: buffer, caption }
        : type === "videoMessage"
        ? { video: buffer, caption }
        : { audio: buffer, mimetype: "audio/mp4", ptt: mediaMsg?.ptt || false };

    // Send to status
    await supreme.sendMessage("status@broadcast", content);
    reply("✅ *Status posted successfully!*");

  } catch (e) {
    console.error("Error in .post command:", e);
    reply(`Error posting status:\n${e.message}`);
  }
 }
},
{
    command: ['update', 'botupdate', 'upgrade'],
    operate: async ({ supreme, m, reply, Access }) => {
        try {
            if (!Access) return reply(global.mess.owner);
            
            // Send initial status message
            let statusMsg = await supreme.sendMessage(m.chat, { 
                text: '🔄 *ＭＡＹＡ - ＸＭＤ*\n\nInitializing update process...' 
            }, { quoted: m });

            // GitHub repository URL for your hidden repo
            const GITHUB_REPO = 'https://github.com/vinicbot-dev/JUNE-X/archive/refs/heads/main.zip';
            
            // Update status
            await supreme.sendMessage(m.chat, { 
                text: '*ＭＡＹＡ - ＸＭＤ*\n\n📥 Downloading latest files from repository...',
                edit: statusMsg.key 
            });
            
            // Download and extract the latest version
            const { copiedFiles } = await updateViaZip(GITHUB_REPO);
            
            // Update status
            await supreme.sendMessage(m.chat, { 
                text: `* ＭＡＹＡ - ＸＭＤ*\n\n✅ Downloaded ${copiedFiles.length} files\n📦 Installing dependencies...`,
                edit: statusMsg.key 
            });
            
            // Install dependencies
            await run('npm install --no-audit --no-fund');
            
            // Final status and restart
            await supreme.sendMessage(m.chat, { 
                text: `✅ *UPDATE COMPLETE!*\n\n📁 Files updated: ${copiedFiles.length}\n📦 Dependencies installed\n\n♻️ Restarting bot in 3 seconds...`,
                edit: statusMsg.key 
            });
            
            // Wait 3 seconds then restart
            setTimeout(() => {
                process.exit(0);
            }, 3000);
            
        } catch (error) {
            console.error('Update error:', error);
            reply(`❌ *UPDATE FAILED!*\n\nError: ${error.message}\n\nPlease check your internet connection and try again.`);
        }
    }
}
            

];
