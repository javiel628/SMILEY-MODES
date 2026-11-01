const moment = require('moment-timezone');
const {translate} = require('@vitalets/google-translate-api')
const googleTTS = require('google-tts-api')
const PDFDocument = require('pdfkit')
const fs = require('fs');
const fetch = require("node-fetch")
const { exec } = require('child_process');
const {styletext, remini, Wikimedia, wallpaper} = require('../start/lib/scraper')
const { takeCommand } = require('../start/supremeCmds/commands');
const { obfuscateJS } = require("../start/lib/encapsulation");

module.exports = [
    {
        command: ['time'],
        operate: async ({ supreme, m, reply, text, timezones, prefix, global }) => {
            try {
                let countryName = text.trim();
                
                if (!countryName) {
                    // If no country provided, show current bot time
                    const now = moment().tz(global.timezones || "Africa/Kampala");
                    const timeInfo = `
     *Current Bot Time* 
    
    🌍 *Timezone:* ${now.format('z (Z)')}
    📅 *Date:* ${now.format('dddd, MMMM Do YYYY')}
    🕒 *Time:* ${now.format('h:mm:ss A')}
    📆 *Week Number:* ${now.format('WW')}
    ⏳ *Day of Year:* ${now.format('DDD')}
    
    *Usage:* ${prefix}time [country name]
    *Example:* ${prefix}time Japan
                    `.trim();

                    return await supreme.sendMessage(m.chat, { 
                        text: `${global.wm || ''}\n\n${timeInfo}`
                    }, { quoted: m });
                }

                // Get timezone for the country
                const timezones = moment.tz.zonesForCountry(countryName);
                
                if (!timezones || timezones.length === 0) {
                    return reply(`❌ *Country not found!*\nPlease provide a valid country name.\n\nExample: ${prefix}time Japan`);
                }

                // Use the first timezone for that country
                const primaryTimezone = timezones[0];
                const now = moment().tz(primaryTimezone);
                
                const timeInfo = `
    ⏰ *Time in ${countryName.toUpperCase()}* ⏰
    
    🌍 *Timezone:* ${primaryTimezone} (${now.format('Z')})
    📅 *Date:* ${now.format('dddd, MMMM Do YYYY')}
    🕒 *Time:* ${now.format('h:mm:ss A')}
    🕛 *24-hour format:* ${now.format('HH:mm:ss')}
    📆 *Week Number:* ${now.format('WW')}
    ⏳ *Day of Year:* ${now.format('DDD')}
    
    *Other timezones in ${countryName}:* ${timezones.slice(0, 5).join(', ')}${timezones.length > 5 ? '...' : ''}
                `.trim();

                await supreme.sendMessage(m.chat, { text: timeInfo }, { quoted: m });

            } catch (error) {
                console.error('Error in time command:', error);
                reply('*Unable to fetch time information.*\nPlease try a different country name or try again later.');
            }
        }
    },
    {
        command: ['calculate', 'calc'],
        operate: async ({ reply, text, prefix }) => {
            try {
                if (!text) return reply(`📝 *Examples:*\n${prefix}calc 5 + 3\n${prefix}calc 10% of 200\n${prefix}calc 2^3\n${prefix}calc sqrt(16)`);

                // Clean and prepare the expression
                const expr = text
                    .replace(/×/g, '*')
                    .replace(/÷/g, '/')
                    .replace(/π/g, Math.PI.toString())
                    .replace(/\^/g, '**')
                    .replace(/sqrt\(/g, 'Math.sqrt(')
                    .replace(/sin\(/g, 'Math.sin(')
                    .replace(/cos\(/g, 'Math.cos(')
                    .replace(/tan\(/g, 'Math.tan(')
                    .replace(/log\(/g, 'Math.log10(')
                    .replace(/ln\(/g, 'Math.log(')
                    .replace(/abs\(/g, 'Math.abs(')
                    .replace(/%/g, '/100')
                    .replace(/deg/g, 'deg')
                    .replace(/,/g, ';')
                    .trim();

                // Validate expression for safety
                const safeRegex = /^[0-9+\-*/().\s\^%πesincoqrtanlgabMh\s]+$/i;
                if (!safeRegex.test(expr)) {
                    return reply('*Invalid characters in expression.*\nOnly numbers, basic operators, and math functions are allowed.');
                }

                let result;
                
                // Handle percentage calculations
                if (text.includes('%')) {
                    const percentMatch = text.match(/(\d+(?:\.\d+)?)%\s*(of)?\s*(\d+(?:\.\d+)?)/i);
                    if (percentMatch) {
                        const percent = parseFloat(percentMatch[1]);
                        const number = parseFloat(percentMatch[3]);
                        result = (percent / 100) * number;
                    }
                }
                
                // Handle unit conversions (optional - you can remove if not needed)
                const convertUnits = (value, fromUnit, toUnit) => {
                    const conversions = {
                        // Length
                        'cm': { 'm': 0.01, 'km': 0.00001, 'inch': 0.393701, 'ft': 0.0328084 },
                        'm': { 'cm': 100, 'km': 0.001, 'inch': 39.3701, 'ft': 3.28084 },
                        'km': { 'm': 1000, 'cm': 100000, 'mile': 0.621371 },
                        // Temperature (requires special handling)
                        'c': { 'f': (c) => (c * 9/5) + 32, 'k': (c) => c + 273.15 },
                        'f': { 'c': (f) => (f - 32) * 5/9, 'k': (f) => (f - 32) * 5/9 + 273.15 },
                        // Weight
                        'kg': { 'g': 1000, 'lb': 2.20462 },
                        'g': { 'kg': 0.001, 'lb': 0.00220462 },
                    };
                    
                    if (fromUnit === toUnit) return value;
                    
                    if (['c', 'f'].includes(fromUnit)) {
                        const tempFunc = conversions[fromUnit]?.[toUnit];
                        if (tempFunc) return tempFunc(value);
                    } else {
                        const rate = conversions[fromUnit]?.[toUnit];
                        if (rate) return value * rate;
                    }
                    
                    return undefined;
                };
                
                if (text.toLowerCase().includes('to')) {
                    const conversionMatch = text.match(/(\d+(?:\.\d+)?)\s*(\w+)\s*to\s*(\w+)/i);
                    if (conversionMatch) {
                        const value = parseFloat(conversionMatch[1]);
                        const fromUnit = conversionMatch[2].toLowerCase();
                        const toUnit = conversionMatch[3].toLowerCase();
                        
                        result = convertUnits(value, fromUnit, toUnit);
                        if (result !== undefined) {
                            return reply(`*Conversion:* ${value} ${fromUnit} = ${result.toFixed(6).replace(/\.?0+$/, '')} ${toUnit}`);
                        }
                    }
                }

                // Evaluate mathematical expression
                if (result === undefined) {
                    try {
                        // Use Function constructor for safer evaluation
                        result = Function('"use strict"; return (' + expr + ')')();
                        
                        // Check if result is valid
                        if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
                            throw new Error('Invalid result');
                        }
                        
                    } catch (evalError) {
                        console.error('Calculation error:', evalError);
                        return reply('*Could not calculate the expression.*\nPlease check your syntax and try again.');
                    }
                }

                // Format the result
                let formattedResult = result;
                if (Number.isInteger(result)) {
                    formattedResult = result.toString();
                } else {
                    formattedResult = result.toFixed(6).replace(/\.?0+$/, '');
                }

                // Create response
                const calculationResponse = `
    🧮 *CALCULATION RESULT*
    
    *Expression:* ${text}
    *Result:* ${formattedResult}
    
    *Full precision:* ${result}
                `.trim();

                reply(calculationResponse);

            } catch (error) {
                console.error('Error in calculate command:', error);
                reply('*An error occurred during calculation.*\nPlease try a different expression.');
            }
        }
    },
    {
        command: ['dev', 'developer', 'owner', 'creator'],
        operate: async ({ reply, m, supreme,  }) => {
            try {
                const devInfo = {
                    name: "Smile Tech",
                    number: "254107065646",
                    organization: "xenocrypt Development Team",
                    note: "Bot Developer"
                };

                const vcard = `BEGIN:VCARD
    VERSION:3.0
    FN:${devInfo.name}
    ORG:${devInfo.organization};
    TEL;type=CELL;type=VOICE;waid=${devInfo.number}:${devInfo.number}
    NOTE:${devInfo.note}
    END:VCARD`;

                // Send contact with caption
                await supreme.sendMessage(
                    m.chat, 
                    {
                        contacts: {
                            displayName: devInfo.name,
                            contacts: [{
                                displayName: devInfo.name,
                                vcard: vcard
                            }]
                        },
                        caption: `👨‍💻 *Developer Contact*\nClick "Share contact" above to save.\n\n📞 *WhatsApp:* wa.me/${devInfo.number}`,
                        contextInfo: {
                            mentionedJid: [m.sender]
                        }
                    },
                    { quoted: m }
                );

            } catch (error) {
                console.error('Error in dev command:', error);
                reply("❌ Failed to send developer contact. Please try again.");
            }
        }
    },
    {
        command: ['say', 'tts', 'speak'],
        operate: async ({ reply, m, supreme, text, args }) => {
            if (!text) return reply("*Text needed!*\n\nExample: .say Hello world");

            try {
                // Check if googleTTS module is available
                if (typeof googleTTS === 'undefined') {
                    return reply("*TTS module not available.*\nPlease install: npm install google-tts-api");
                }

                const ttsData = await googleTTS.getAllAudioBase64(text, {
                    lang: "en",
                    slow: false,
                    host: "https://translate.google.com",
                    timeout: 10000,
                });

                if (!ttsData.length) return reply("*Failed to generate TTS audio.*");

                const tempFiles = [];
                for (let i = 0; i < ttsData.length; i++) {
                    let filePath = `/tmp/tts_part${i}.mp3`;
                    fs.writeFileSync(filePath, Buffer.from(ttsData[i].base64, "base64"));
                    tempFiles.push(filePath);
                }

                let mergedFile = "/tmp/tts_merged.mp3";
                let ffmpegCommand = `ffmpeg -i "concat:${tempFiles.join('|')}" -acodec copy ${mergedFile}`;
                
                exec(ffmpegCommand, async (err) => {
                    if (err) {
                        console.error("FFmpeg error:", err);
                        tempFiles.forEach(file => {
                            try { fs.unlinkSync(file); } catch (e) {}
                        });
                        return reply("*Error merging audio files.*");
                    }

                    await supreme.sendMessage(
                        m.chat,
                        {
                            audio: fs.readFileSync(mergedFile),
                            mimetype: "audio/mp4",
                            mp3: true,
                            fileName: "tts_audio.mp3",
                        },
                        { quoted: m }
                    );

                    // Clean up temporary files
                    tempFiles.forEach(file => {
                        try { fs.unlinkSync(file); } catch (e) {}
                    });
                    try { fs.unlinkSync(mergedFile); } catch (e) {}
                });

            } catch (error) {
                console.error("Error in TTS Command:", error);
                reply("*An error occurred while processing the TTS request.*");
            }
        }
    },
{
    command: ['translate', 'tr', 'eng', 'english'],
    operate: async ({ supreme, m, reply, text, prefix }) => {
              if (!text) {
            return reply(`🌍 *Translate to English*\n\nUsage: ${prefix}translate <text>\n\nExamples:\n• ${prefix}translate Hola\n• ${prefix}translate Bonjour\n• ${prefix}translate 你好`);
        }

        try {
            // React immediately
            await supreme.sendMessage(m.chat, {
                react: { text: "🌍", key: m.key }
            });

            const apiUrl = `https://api.popcat.xyz/v2/translate?to=en&text=${encodeURIComponent(text)}`;
            const res = await fetch(apiUrl, { timeout: 10000 });
            const data = await res.json();

            // Check for errors
            if (data.error === true) {
                return reply(`❌ Translation failed: ${data.message || 'Unknown error'}`);
            }

            
            let translated = data.message?.translated;
            
            // If translated is still an object, try to extract string
            if (translated && typeof translated === 'object') {
                translated = translated.text || translated.translated || JSON.stringify(translated);
            }
            
            // Validate we have a string
            if (!translated || typeof translated !== 'string') {
                return reply(`❌ Translation failed. Could not extract translation from response.`);
            }

            // Clean and format
            await supreme.sendMessage(m.chat, {
                text: `*TRANSLATION*\n\n🗣️ *Original:* ${text}\n\n*Translatd:* ${translated}\n\n`
            }, { quoted: m });

        } catch (error) {
            console.error('Translate error:', error);
            
            if (error.message.includes('timeout')) {
                reply('⏰ Translation timeout. Try shorter text.');
            } else {
                reply('❌ Translation failed. Try again.');
            }
        }
    }
}, 
    {
        command: ['tinylink', 'shorten', 'shorturl', 'tinyurl'],
        operate: async ({ reply, prefix, text, axios }) => {
            if (!text) return reply(`*Example:* ${prefix}shorten https://github.com/Kevintech-hub/Vinic-Xmd-`);
            
            // Check if URL is valid
            if (!text.startsWith('http')) {
                text = 'https://' + text;
            }
            
            const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
            if (!urlPattern.test(text)) {
                return reply("*Invalid URL format!*\nPlease provide a valid URL.");
            }
            
            try {
                const response = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(text)}`);
                
                if (response.data && response.data.includes('http')) {
                    reply(`🔗 *URL Shortened Successfully!*\n\n📌 *Original URL:*\n${text}\n\n✨ *Shortened URL:*\n${response.data}`);
                } else {
                    reply("*Failed to shorten URL. Please try again later.*");
                }
            } catch (error) {
                console.error('URL shortening error:', error);
                reply('*An error occurred while shortening the URL.*\nPlease try again later.');
            }
        }
    },
    {
        command: ['vcc', 'vccgen', 'cardgen', 'generatecard'],
        operate: async ({ reply, fetch, text }) => {
            try {
                // Parse arguments for custom type/count
                let cardType = "MasterCard";
                let count = 5;
                
                if (text) {
                    const args = text.toLowerCase().split(' ');
                    if (args.includes('visa')) cardType = "Visa";
                    if (args.includes('amex') || args.includes('american')) cardType = "American Express";
                    if (args.includes('discover')) cardType = "Discover";
                    
                    const countMatch = text.match(/(\d+)/);
                    if (countMatch && parseInt(countMatch[1]) > 0 && parseInt(countMatch[1]) <= 20) {
                        count = parseInt(countMatch[1]);
                    }
                }

                const apiUrl = `${global.siputzx}/api/s/gsmarena?query=${encodeURIComponent(text)}`;

                const response = await fetch(apiUrl);
                const result = await response.json();

                if (!result.status || !result.data || result.data.length === 0) {
                    return reply("*Unable to generate VCCs.*\nThe service might be temporarily unavailable.");
                }

                let responseMessage = `🎴 *Generated ${cardType} Virtual Credit Cards*\n`;
                responseMessage += `📊 *Count:* ${count}\n`;
                responseMessage += `⏰ *Generated at:* ${new Date().toLocaleTimeString()}\n\n`;
                responseMessage += `⚠️ *Disclaimer:* These are test cards for development purposes only.\n\n`;

                result.data.forEach((card, index) => {
                    responseMessage += `▰▰▰▰▰▰▰▰▰▰▰▰▰\n`;
                    responseMessage += `💳 *Card ${index + 1}:*\n`;
                    responseMessage += `🔢 *Number:* \`${card.cardNumber}\`\n`;
                    responseMessage += `📅 *Expiry:* ${card.expirationDate}\n`;
                    responseMessage += `👤 *Holder:* ${card.cardholderName}\n`;
                    responseMessage += `🔐 *CVV:* \`${card.cvv}\`\n`;
                });

                responseMessage += `\n▰▰▰▰▰▰▰▰▰▰▰▰▰\n`;
                responseMessage += `*Note:* These cards are not valid for real transactions.`;

                reply(responseMessage);

            } catch (error) {
                console.error("Error fetching VCC data:", error);
                reply("❌ *An error occurred while generating VCCs.*\nPlease try again later.");
            }
        }
    },
    {
        command: ['qrcode', 'qr'],
        operate: async ({ reply, m, supreme, text }) => {
            if (!text) return reply("Enter text or URL");

            try {
                let res = await fetch(`https://api.qrserver.com/v1/create-qr-code/?data=${text}&size=200x200`);
                let qrCodeUrl = res.url;

                await supreme.sendMessage(m.chat, { 
                    image: { url: qrCodeUrl },
                    caption: `QR Code for: ${text}`
                }, { quoted: m });
            } catch (error) {
                console.error('Error generating QR code:', error);
                reply('An error occurred while generating the QR code.');
            }
        }
    },
    {
        command: ['getdevice', 'device'],
        operate: async ({ reply, m, text, getDevice }) => {
            if (!m.quoted) {
                return reply('*Please quote a message to use this command!*');
            }
            
            console.log('Quoted Message:', m.quoted);
            console.log('Quoted Key:', m.quoted?.key);

            try {
                const quotedMsg = await m.getQuotedMessage();

                if (!quotedMsg) {
                    return reply('*Could not detect, please try with newly sent message!*');
                }

                const messageId = quotedMsg.key.id;

                const device = getDevice(messageId) || 'Unknown';

                reply(`The message is sent from *${device}* device.`);
            } catch (err) {
                console.error('Error determining device:', err);
                reply('Error determining device: ' + err.message);
            }
        }
    },
    {
        command: ['browse', 'fetch'],
        operate: async ({ reply, m, supreme, text, fetch }) => {
            if (!text) return reply("Enter URL");

            try {
                let res = await fetch(text);

                if (res.headers.get('Content-Type').includes('application/json')) {
                    let json = await res.json();
                    await supreme.sendMessage(m.chat, { 
                        text: JSON.stringify(json, null, 2) 
                    }, { quoted: m });
                } else {
                    let resText = await res.text();
                    await supreme.sendMessage(m.chat, { 
                        text: resText 
                    }, { quoted: m });
                }

                if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
            } catch (error) {
                reply(`Error fetching URL: ${error.message}`);
            }
        }
    },
    {
        command: ['filtervcf', 'cleanvcf'],
        operate: async ({ reply, m, supreme, text }) => {
            const quoted = m.quoted ? m.quoted : null;
            const mime = quoted?.mimetype || "";
            const normalizePhoneNumber = (phone) => {
                if (!phone || typeof phone !== 'string') return null;
                return phone.replace(/\D/g, '');
            };

            if (!quoted || !(mime === "text/vcard" || mime === "text/x-vcard")) {
                return supreme.sendMessage(m.chat, { 
                    text: "❌ *Error:* Reply to a `.vcf` file with `.filtervcf` or `.cleanvcf`!" 
                }, { quoted: m });
            }

            try {
                const media = await quoted.download();
                const vcfContent = media.toString('utf8');
                
                await supreme.sendMessage(m.chat, { 
                    text: "🔍 Filtering VCF - checking WhatsApp numbers, this may take a while..." 
                }, { quoted: m });

                const vCards = vcfContent.split('END:VCARD')
                    .map(card => card.trim())
                    .filter(card => card.length > 0);

                const validContacts = [];
                const invalidContacts = [];
                let processed = 0;

                for (const card of vCards) {
                    try {
                        const telMatch = card.match(/TEL[^:]*:([^\n]+)/);
                        if (!telMatch) continue;
                        
                        const phoneRaw = telMatch[1].trim();
                        const phoneNumber = normalizePhoneNumber(phoneRaw);
                        if (!phoneNumber) continue;

                        const jid = `${phoneNumber}@s.whatsapp.net`;
                        const result = await supreme.onWhatsApp(jid);
                        
                        if (result.length > 0 && result[0].exists) {
                            validContacts.push(card);
                        } else {
                            invalidContacts.push(phoneNumber);
                        }
                    } catch (error) {
                        console.error('Error processing contact:', error);
                    }
                }

                const filteredVcf = validContacts.join('\nEND:VCARD\n') + (validContacts.length > 0 ? '\nEND:VCARD' : '');
                
                const resultMessage = `✅ *VCF Filtering Complete*\n\n` +
                    `• Total contacts: ${vCards.length}\n` +
                    `• Valid WhatsApp contacts: ${validContacts.length}\n` +
                    `• Non-WhatsApp numbers removed: ${invalidContacts.length}\n\n` +
                    `Sending filtered VCF file...`;

                await supreme.sendMessage(m.chat, { text: resultMessage }, { quoted: m });

                await supreme.sendMessage(m.chat, { 
                    document: Buffer.from(filteredVcf), 
                    mimetype: "text/x-vcard", 
                    fileName: "smile_contacts.vcf" 
                });

            } catch (error) {
                await supreme.sendMessage(m.chat, { 
                    text: `❌ *Error:* ${error.message}` 
                }, { quoted: m });
            }
        }
    },
    {
    command: ['removebg', 'nobg', 'rmbg'],
    operate: async ({ supreme, m, reply, text, prefix }) => {
        try {
            if (!text && !m.quoted) {
                return reply(`*Usage:*\n${prefix}removebg <image_url>\nor reply to an image with ${prefix}removebg`);
            }

            let imageUrl = '';
            
            // Handle URL input
            if (text) {
                imageUrl = text.trim();
                if (!imageUrl.startsWith('http')) {
                    imageUrl = 'https://' + imageUrl;
                }
            }
            // Handle quoted image
            else if (m.quoted) {
                const mime = m.quoted.mimetype || '';
                if (!mime.includes('image') && !mime.includes('sticker')) {
                    return reply('Please reply to an image or sticker!');
                }
                
                const buffer = await m.quoted.download();
                const base64 = buffer.toString('base64');
                
                // Upload to Telegra.ph
                const uploadRes = await fetch('https://telegra.ph/upload', {
                    method: 'POST',
                    body: JSON.stringify({ data: base64 }),
                    headers: { 'Content-Type': 'application/json' }
                });
                
                const uploadData = await uploadRes.json();
                if (!uploadData[0]?.src) {
                    return reply('❌ Failed to upload image. Try providing a direct URL instead.');
                }
                
                imageUrl = 'https://telegra.ph' + uploadData[0].src;
            }

            // Send processing message
            await reply('*Removing background Please wait*....');
            
            
            const apiUrl = `https://api.giftedtech.co.ke/api/tools/removebg?url=${encodeURIComponent(imageUrl)}&apikey=gifted`;
            const response = await fetch(apiUrl);
            const result = await response.json();
            
            if (!result.success || !result.result?.image_url) {
                return reply('Failed to remove background. Try with a different image.');
            }
            
            // Send the processed image
            await supreme.sendMessage(m.chat, {
                image: { url: result.result.image_url },
                caption: `✅ *Background Removed Successfully*`,
                mentions: [m.sender]
            }, { quoted: m });
            
        } catch (error) {
            console.error('RemoveBG Error:', error);
            
            if (error.message.includes('timeout')) {
                reply('Request timeout. Try with a smaller image.');
            } else if (error.message.includes('fetch failed')) {
                reply('Cannot connect to API. Check your internet.');
            } else {
                reply('Failed to process image. Try again later.');
            }
        }
    }
},
    {
        command: ['styletext', 'fancytext', 'stylish'],
        operate: async ({ reply, text }) => {
            if (!text) return reply('*Enter a text!*');
            
            try {
                let anu = await styletext(text);
                let teks = `*Styles for "${text}"*\n\n`;
                
                for (let i of anu) {
                    teks += `▢ *${i.name}* : ${i.result}\n\n`;
                }
                
                reply(teks);
            } catch (error) {
                console.error(error);
                reply('*An error occurred while fetching fancy text styles.*');
            }
        }
},
{
    command: ['sswebtab', 'sstab'],
    operate: async ({ reply, m, supreme, text }) => {
        const q = text.trim();
        if (!q) return reply(`Please provide a URL to screenshot!`);
        
        const apiURL = `https://api.tioo.eu.org/sstab?url=${q}`;
        
        try {
            await supreme.sendMessage(m.chat, { 
                image: { url: apiURL },
                caption: `Screenshot of: ${q}`
            }, { quoted: m });
        } catch (error) {
            console.error('Error generating screenshot:', error);
            reply("An error occurred while taking the screenshot.");
        }
    }
},
{
    command: ['ss2', 'ssmobile'],
    operate: async ({ reply, m, supreme, text }) => {
        const q = text.trim();
        if (!q) return reply(`Please provide a URL to screenshot!`);
        
        const apiURL = `${global?.siputzx || 'https://api.siputzx.xyz'}/api/tools/ssweb?url=${q}&theme=light&device=mobile`;
        
        try {
            await supreme.sendMessage(m.chat, { 
                image: { url: apiURL },
                caption: `Mobile Screenshot of: ${q}`
            }, { quoted: m });
        } catch (error) {
            console.error('Error generating screenshot:', error);
            reply("An error occurred while generating the mobile screenshot.");
        }
    }
},
{
    command: ['ss', 'screenshot'],
    operate: async ({ reply, m, supreme, args, text }) => {
        try {
            const url = text.trim();
            if (!url) return reply("❌ Please provide a URL\nExample: .ss https://google.com");
            if (!url.startsWith("http")) return reply("❌ URL must start with http:// or https://");

            // Send initial loading message
            const loadingMsg = await supreme.sendMessage(m.chat, {
                text: "🔄 Starting screenshot capture...\n✦ Please wait..."
            }, { quoted: m });

            try {
                // Send the screenshot
                await supreme.sendMessage(m.chat, {
                    image: { url: `https://image.thum.io/get/fullpage/${url}` },
                    caption: `- 🖼️ *Screenshot Generated*\n\n` +
                            `📸 *URL:* ${url}\n` +
                            `> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ${global.botname || 'ＭＡＹＡ - ＸＭＤ'} 💪 💜`
                }, { quoted: m });

                // Update loading message to success
                await supreme.relayMessage(m.chat, {
                    protocolMessage: {
                        key: loadingMsg.key,
                        type: 14,
                        editedMessage: {
                            conversation: "✅ Screenshot successfully captured and sent!"
                        }
                    }
                }, {});

            } catch (captureError) {
                // Update loading message to error
                await supreme.relayMessage(m.chat, {
                    protocolMessage: {
                        key: loadingMsg.key,
                        type: 14,
                        editedMessage: {
                            conversation: "❌ Failed to capture screenshot\n✦ Please try again later"
                        }
                    }
                }, {});
                throw captureError;
            }

        } catch (error) {
            console.error("Screenshot error:", error);
            reply("❌ Failed to capture screenshot\n✦ Please try again later or try a different URL");
        }
    }
},
{
    command: ['sswebpc', 'sspc', 'ssdesktop'],
    operate: async ({ reply, m, supreme, text }) => {
        const q = text.trim();
        if (!q) return reply(`Please provide a URL to screenshot!`);
        
        const apiURL = `${global?.siputzx || 'https://api.siputzx.xyz'}/api/tools/ssweb?url=${q}&theme=light&device=tablet`;
        
        try {
            await supreme.sendMessage(m.chat, { 
                image: { url: apiURL },
                caption: `💻 Desktop Screenshot of: ${q}`
            }, { quoted: m });
        } catch (error) {
            console.error('Error generating screenshot:', error);
            reply("An error occurred while taking the desktop screenshot.");
        }
    }
},
{
        command: ['take', 'copysticker', 'stealsticker'],
        operate: async ({ supreme, m, reply, args, text }) => {
            await takeCommand(supreme, m.chat, m, args);
        }
},
{
    command: ['obfuscate'],
    operate: async ({ reply, m, supreme }) => {
        // Directory creation code
        const tmpDir = './tmp';
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }
        
        const quoted = m.quoted ? m.quoted : null;
        const mime = quoted?.mimetype || "";

        if (!quoted || mime !== "application/javascript") {
            return supreme.sendMessage(m.chat, { 
                text: "❌ *Error:* Reply to a `.js` file with `.obfuscate`!" 
            }, { quoted: m });
        }
        
        try {
            const media = await quoted.download();
            const tempFile = `./tmp/original-${Date.now()}.js`;
            await fs.promises.writeFile(tempFile, media);

            supreme.sendMessage(m.chat, { 
                text: "🔒 Obfuscation started..." 
            }, { quoted: m });

            const obfuscatedFile = await obfuscateJS(tempFile);

            await supreme.sendMessage(m.chat, { 
                text: "✅ Obfuscation complete! Sending file..." 
            }, { quoted: m }); 
            
            await supreme.sendMessage(m.chat, { 
                document: fs.readFileSync(obfuscatedFile), 
                mimetype: "text/javascript", 
                fileName: "obfuscated.js" 
            });

            await fs.promises.unlink(tempFile);
            await fs.promises.unlink(obfuscatedFile);
            
        } catch (error) {
            supreme.sendMessage(m.chat, { 
                text: `❌ *Error:* ${error.message}` 
            }, { quoted: m });
        }
    }
},
{
    command: ['obfuscate2', 'obfus', 'encrypt'],
    operate: async ({ reply, m, supreme, text, prefix }) => {
        if (!text) return reply(`*Usage:* ${prefix}obfuscate <code>\n*Example:* ${prefix}obfuscate console.log("Hello World")`);
        
        try {
            // Send loading reaction
            await supreme.sendMessage(m.chat, {
                react: {
                    text: "⏳",
                    key: m.key
                }
            });

            // Encode the code for the URL
            const encodedCode = encodeURIComponent(text);
            
            // API endpoint
            const apiUrl = `https://api.giftedtech.co.ke/api/tools/encryptv2?apikey=gifted&code=${encodedCode}`;
            
            console.log("Obfuscate: Making API request to:", apiUrl);
            
            // Fetch the obfuscated code
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            console.log("Obfuscate: API Response:", JSON.stringify(data, null, 2));
            
            let obfuscatedCode = '';
            
            // Handle different response formats
            if (data && typeof data === 'object') {
                if (data.result && typeof data.result === 'string') {
                    obfuscatedCode = data.result;
                } else if (data.encrypted && typeof data.encrypted === 'string') {
                    obfuscatedCode = data.encrypted;
                } else if (data.code && typeof data.code === 'string') {
                    obfuscatedCode = data.code;
                } else if (data.data && typeof data.data === 'string') {
                    obfuscatedCode = data.data;
                } else if (data.message && typeof data.message === 'string') {
                    obfuscatedCode = data.message;
                } else {
                    // If we get an object but can't find the string, try to stringify it
                    obfuscatedCode = JSON.stringify(data, null, 2);
                    console.warn("Obfuscate: Unexpected response format, using JSON stringify");
                }
            } else if (typeof data === 'string') {
                obfuscatedCode = data;
            } else {
                throw new Error('Unexpected response format from API');
            }
            
            // Validate that we actually got obfuscated code
            if (!obfuscatedCode || obfuscatedCode.trim() === '') {
                throw new Error('API returned empty result');
            }
            
            // Success reaction
            await supreme.sendMessage(m.chat, {
                react: {
                    text: "✅",
                    key: m.key
                }
            });
            
            // Truncate long code for display
            const displayOriginal = text.length > 500 ? text.substring(0, 500) + '...' : text;
            const displayObfuscated = obfuscatedCode.length > 1500 ? obfuscatedCode.substring(0, 1500) + '...' : obfuscatedCode;
            
            // Send the obfuscated code
            await supreme.sendMessage(m.chat, {
                text: `*🔒 OBFUSCATED CODE*\n\n*Original Code:*\n\`\`\`javascript\n${displayOriginal}\n\`\`\`\n\n*Obfuscated Code:*\n\`\`\`javascript\n${displayObfuscated}\n\`\`\`\n\n*📝 Note:* Code has been obfuscated successfully!`,
                contextInfo: {
                    mentionedJid: [m.sender],
                    externalAdReply: {
                        title: "🔒 Code Obfuscator",
                        body: "Powered by ＭＡＹＡ - ＸＭＤ",
                        thumbnail: global.peler || null,
                        sourceUrl: 'https://api.giftedtech.co.ke'
                    }
                }
            }, { quoted: m });
            
        } catch (error) {
            console.error('Obfuscate Error:', error);
            
            // Error reaction
            await supreme.sendMessage(m.chat, {
                react: {
                    text: "❌",
                    key: m.key
                }
            });
            
            reply(`❌ *Failed to obfuscate code!*\nError: ${error.message}\n\nPlease try again with different code or try later.`);
        }
    }
},
{
        command: ['emoji', 'emojify'],
        operate: async ({ supreme, m, reply, args, text }) => {
            try {
                let inputText = text || args.join(" ");
                
                if (!inputText) {
                    return reply("Please provide some text to convert into emojis!");
                }

                let emojiMapping = {
                    "a": "🅰️", "b": "🅱️", "c": "🇨️", "d": "🇩️", "e": "🇪️",
                    "f": "🇫️", "g": "🇬️", "h": "🇭️", "i": "🇮️", "j": "🇯️",
                    "k": "🇰️", "l": "🇱️", "m": "🇲️", "n": "🇳️", "o": "🅾️",
                    "p": "🇵️", "q": "🇶️", "r": "🇷️", "s": "🇸️", "t": "🇹️",
                    "u": "🇺️", "v": "🇻️", "w": "🇼️", "x": "🇽️", "y": "🇾️",
                    "z": "🇿️", "0": "0️⃣", "1": "1️⃣", "2": "2️⃣", "3": "3️⃣",
                    "4": "4️⃣", "5": "5️⃣", "6": "6️⃣", "7": "7️⃣", "8": "8️⃣",
                    "9": "9️⃣", " ": "␣", "!": "❗", "?": "❓", ".": "🔸"
                };

                let emojiText = inputText.toLowerCase().split("").map(char => emojiMapping[char] || char).join("");

                await supreme.sendMessage(m.chat, {
                    text: emojiText,
                }, { quoted: m });

            } catch (error) {
                console.log(error);
                reply(`Error: ${error.message}`);
            }
        }
    },
{
        command: ['smartphone', 'gsmarena'],
        operate: async ({ reply, text, mess }) => {
            if (!text) return reply("*Please provide a query to search for smartphones.*");

            try {
                const apiUrl = `${global.siputzx}/api/s/gsmarena?query=${encodeURIComponent(text)}`;
                const response = await fetch(apiUrl);
                const result = await response.json();

                if (!result.status || !result.data || result.data.length === 0) {
                    return reply("*No results found. Please try another query.*");
                }

                const limitedResults = result.data.slice(0, 10);
                let responseMessage = `*📱 Top 10 Smartphone Results for "${text}":*\n\n`;

                for (let item of limitedResults) {
                    responseMessage += `📱 *Name:* ${item.name}\n`;
                    responseMessage += `📝 *Description:* ${item.description}\n`;
                    responseMessage += `🌐 [View Image](${item.thumbnail})\n\n`;
                }

                reply(responseMessage);
            } catch (error) {
                console.error('Error fetching results from GSMArena API:', error);
                reply("❌ An error occurred while fetching results from GSMArena.");
            }
        }
    },
    {
    command: ['cekidch', 'idch'],
    operate: async ({ supreme, m, reply, text }) => {
        if (!text) return reply("*Please provide a WhatsApp channel link*");
        if (!text.includes("https://whatsapp.com/channel/")) return reply("*Invalid channel link*");
        
        try {
            let result = text.split('https://whatsapp.com/channel/')[1];
            let res = await supreme.newsletterMetadata("invite", result);
            
            let teks = `
*ID:* ${res.id}
*Name:* ${res.name}
*Total followers:* ${res.subscribers}
*Status:* ${res.state}
*Verified:* ${res.verification == "VERIFIED" ? "✅ Verified" : "❌ Not Verified"}
`;
            
            return reply(teks);
            
        } catch (error) {
            console.error('Error fetching channel info:', error);
            return reply("*Failed to fetch channel information. Please check the link and try again.*");
        }
    }
},
    {
    command: ['channelinfo'],
    operate: async ({ supreme, m, reply, text }) => {
        try {
            if (!text) return reply('Please provide Whatsapp Channel link');

            const match = text.match(/whatsapp\.com\/channel\/([\w-]+)/);
            if (!match) return reply('❌ Invalid WhatsApp channel link!');

            const inviteId = match[1];
            const sender = m.sender;
            const from = m.chat;
            
            let channelId = null;
            let externalInfo = null;

            // METHOD 1: Get Channel ID using direct Baileys API (for the ID)
            try {
                const metadata = await supreme.newsletterMetadata("invite", inviteId);
                if (metadata?.id) {
                    channelId = metadata.id;
                    console.log('✅ Got Channel ID from direct API:', channelId);
                }
            } catch (error) {
                console.log('❌ Direct API failed for ID');
            }

            // METHOD 2: Get detailed info from external API (for name, followers, description)
            try {
                const { data } = await axios.get(`https://api.nexoracle.com/stalking/whatsapp-channel?apikey=e276311658d835109c&url=${encodeURIComponent(text)}`, {
                    timeout: 15000
                });
                if (data?.result) {
                    externalInfo = data.result;
                    console.log('✅ Got details from external API');
                }
            } catch (error) {
                console.log('❌ External API failed for details');
            }

            // If we have both, combine them
            if (channelId && externalInfo) {
                const { title, followers, description, image } = externalInfo;
                
                const infoText = `📡 *WhatsApp Channel Information*\n\n` +
                                `🔖 *Channel ID:* ${channelId}\n` +
                                `📛 *Name:* ${title || 'No name'}\n` +
                                `👥 *Followers:* ${followers || 'Not available'}\n` +
                                `📝 *Description:* ${description || 'No description'}\n` +
                                `🔗 *Invite ID:* ${inviteId}\n\n` +
                                `👤 *Requested by:* @${sender.split('@')[0]}\n` +
                                `> ${global.wm || ''}`;

                if (image) {
                    await supreme.sendMessage(from, {
                        image: { url: image },
                        caption: infoText,
                        mentions: [sender]
                    }, { quoted: m });
                } else {
                    await reply(infoText);
                }
            }
            // If only direct API worked (we have ID but no details)
            else if (channelId) {
                const infoText = `📡 *WhatsApp Channel Information*\n\n` +
                                `🔖 *Channel ID:* ${channelId}\n` +
                                `📛 *Name:* No name\n` +
                                `👥 *Followers:* Not available\n` +
                                `📝 *Description:* No description\n` +
                                `🔗 *Invite ID:* ${inviteId}\n\n` +
                                `👤 *Requested by:* @${sender.split('@')[0]}\n` +
                                `> ${global.wm || ''}`;
                
                await reply(infoText);
            }
            // If only external API worked (we have details but no ID)
            else if (externalInfo) {
                const { title, followers, description, image, newsletterJid } = externalInfo;
                
                const infoText = `📡 *WhatsApp Channel Information*\n\n` +
                                `🔖 *Channel ID:* ${newsletterJid || 'Not available'}\n` +
                                `📛 *Name:* ${title || 'No name'}\n` +
                                `👥 *Followers:* ${followers || 'Not available'}\n` +
                                `📝 *Description:* ${description || 'No description'}\n` +
                                `🔗 *Invite ID:* ${inviteId}\n\n` +
                                `👤 *Requested by:* @${sender.split('@')[0]}\n` +
                                `> ${global.wm || ''}`;

                if (image) {
                    await supreme.sendMessage(from, {
                        image: { url: image },
                        caption: infoText,
                        mentions: [sender]
                    }, { quoted: m });
                } else {
                    await reply(infoText);
                }
            }
            // If both failed
            else {
                await reply('❌ Failed to fetch channel information from both sources. The channel may be private or the link is invalid.');
            }

        } catch (error) {
            console.error('Newsletter command error:', error);
            await reply('❌ An unexpected error occurred while fetching channel information.');
        }
    }
},
{
        command: ['npm'],
        operate: async ({ supreme, m, reply, args, text, botNumber, }) => {
            try {
                // Check if a package name is provided
                if (!args.length) {
                    return reply("Please provide the name of the npm package you want to search for. Example: .npm express");
                }

                const packageName = args.join(" ");
                const apiUrl = `https://registry.npmjs.org/${encodeURIComponent(packageName)}`;

                // Fetch package details from npm registry
                const response = await axios.get(apiUrl);
                if (response.status !== 200) {
                    throw new Error("Package not found or an error occurred.");
                }

                const packageData = response.data;
                const latestVersion = packageData["dist-tags"].latest;
                const description = packageData.description || "No description available.";
                const npmUrl = `https://www.npmjs.com/package/${packageName}`;
                const license = packageData.license || "Unknown";
                const repository = packageData.repository ? packageData.repository.url : "Not available";

                // Create the response message
                const message = `
*${global.botname} npm search*

*👀 NPM PACKAGE:* ${packageName}
*📄 DESCRIPTION:* ${description}
*⏸️ LAST VERSION:* ${latestVersion}
*🪪 LICENSE:* ${license}
*🪩 REPOSITORY:* ${repository}
*🔗 NPM URL:* ${npmUrl}
`;

                // Send the message
                await supreme.sendMessage(m.chat, { text: message }, { quoted: m });

            } catch (error) {
                console.error("Error:", error);
                reply("An error occurred: " + error.message);
            }
        }
},
{
    command: ['gpass', 'password', 'genpass'],
    operate: async ({ supreme, m, reply, text }) => {
        let length = text ? parseInt(text) : 12;
        if (isNaN(length) || length < 6 || length > 50) {
            return reply("Please provide a valid length between 6 and 50. Example: .gpass 16");
        }
        
        let chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
        let pass = "";
        for (let i = 0; i < length; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        try {
            supreme.sendMessage(m.chat, { text: pass }, { quoted: m });
        } catch (error) {
            console.error('Error generating password:', error);
            reply('An error occurred while generating the password.');
        }
    }
},
{
  command: ['emojimix', 'emix'],
  operate: async ({ m, text, prefix, command, supreme, fetchJson, reply }) => {
    let [emoji1, emoji2] = text.split`+`;
    
    if (!emoji1)
      return reply(`*Example : ${prefix + command} 😅+🤔*`);
    
    if (!emoji2)
      return reply(`*Example : ${prefix + command} 😅+🤔*`);
    
    try {
      let anu = await fetchJson(
        `https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5&q=${encodeURIComponent(
          emoji1
        )}_${encodeURIComponent(emoji2)}`
      );
      
      for (let res of anu.results) {
        await supreme.sendImageAsSticker(
          m.chat,
          res.url,
          m,
          {
            packname: global.packname,
            author: global.author,
            categories: res.tags,
          }
        );
      }
    } catch (error) {
      console.error(error);
      reply('*An error occurred while fetching emoji mix.*');
    }
  }
},
{
  command: ['trackip'],
  operate: async ({ m, text, prefix, command, supreme, reply }) => {
  if (!text) return m.reply(`*Example:* ${prefix + command} 112.90.150.204`);
try {
let res = await fetch(`https://ipwho.is/${text}`).then(result => result.json());

const formatIPInfo = (info) => {
 return `
*IP Information*
• IP: ${info.ip || 'N/A'}
• Success: ${info.success || 'N/A'}
• Type: ${info.type || 'N/A'}
• Continent: ${info.continent || 'N/A'}
• Continent Code: ${info.continent_code || 'N/A'}
• Country: ${info.country || 'N/A'}
• Country Code: ${info.country_code || 'N/A'}
• Region: ${info.region || 'N/A'}
• Region Code: ${info.region_code || 'N/A'}
• City: ${info.city || 'N/A'}
• Latitude: ${info.latitude || 'N/A'}
• Longitude: ${info.longitude || 'N/A'}
• Is EU: ${info.is_eu ? 'Yes' : 'No'}
• Postal: ${info.postal || 'N/A'}
• Calling Code: ${info.calling_code || 'N/A'}
• Capital: ${info.capital || 'N/A'}
• Borders: ${info.borders || 'N/A'}
• Flag:
 - Image: ${info.flag?.img || 'N/A'}
 - Emoji: ${info.flag?.emoji || 'N/A'}
 - Emoji Unicode: ${info.flag?.emoji_unicode || 'N/A'}
• Connection:
 - ASN: ${info.connection?.asn || 'N/A'}
 - Organization: ${info.connection?.org || 'N/A'}
 - ISP: ${info.connection?.isp || 'N/A'}
 - Domain: ${info.connection?.domain || 'N/A'}
• Timezone:
 - ID: ${info.timezone?.id || 'N/A'}
 - Abbreviation: ${info.timezone?.abbr || 'N/A'}
 - Is DST: ${info.timezone?.is_dst ? 'Yes' : 'No'}
 - Offset: ${info.timezone?.offset || 'N/A'}
 - UTC: ${info.timezone?.utc || 'N/A'}
 - Current Time: ${info.timezone?.current_time || 'N/A'}
`;
};

if (!res.success) throw new Error(`IP ${text} not found!`);
await supreme.sendMessage(m.chat, { location: { degreesLatitude: res.latitude, degreesLongitude: res.longitude } }, { ephemeralExpiration: 604800 });
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
await delay(2000);
m.reply(formatIPInfo(res)); 
} catch (e) { 
m.reply(`Error: Unable to retrieve data for IP ${text}`);
  }
 }
}


]