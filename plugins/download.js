const axios = require('axios');
const fs = require('fs');
const fg = require('api-dylux')
const path = require('path');
const fetch = require('node-fetch');
const yts = require('yt-search');
const { KelvinVideo } = require('../start/supremeCmds/video');
const {  } = require('../start/lib/myfunction');
const { 
    playCommand, 
    InstagramCommand, 
    handleMediafireDownload, 
    ytplayCommand, 
    videoCommand, 
    takeCommand 
} = require('../start/supremeCmds/commands');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


module.exports = [

{
    command: ['song', 'mp3'],
    operate: async ({ supreme, m, reply, text, prefix, command }) => {
        
        if (!text) return reply(`📌 Example: ${prefix + command} shape of you`);
        
        try {
            await reply("🔍 Searching...");
            
            // Search for the song
            const searchUrl = `https://meta-api.zone.id/search/youtube?query=${encodeURIComponent(text)}`;
            const searchRes = await axios.get(searchUrl, { timeout: 30000 });
            const searchData = searchRes.data;
            
            if (!searchData?.result?.[0]?.videoId) {
                return reply("❌ No results found.");
            }
            
            const videoId = searchData.result[0].videoId;
            const title = searchData.result[0].title || text;
            const thumbnail = searchData.result[0].thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            
            // Get download link - try direct MP3 first
            const downloadUrl = `https://meta-api.zone.id/downloader/youtube?url=https://youtu.be/${videoId}`;
            const downloadRes = await axios.get(downloadUrl, { timeout: 30000 });
            const downloadData = downloadRes.data;
            
            let audioUrl = null;
            
            // Try different possible locations for audio URL
            if (downloadData?.result?.audio) {
                audioUrl = downloadData.result.audio;
            } else if (downloadData?.result?.url) {
                audioUrl = downloadData.result.url;
            } else if (downloadData?.result?.formats?.[0]?.url) {
                audioUrl = downloadData.result.formats[0].url;
            }
            
            if (!audioUrl) {
                return reply("❌ Couldn't get audio download link.");
            }
            
            // React
            await supreme.sendMessage(m.chat, {
                react: { text: "🎵", key: m.key }
            });
            
            // Send song info
            await supreme.sendMessage(
                m.chat,
                {
                    image: { url: thumbnail },
                    caption: `🎵 *${title}*\n\n` +
                        `📥 Downloading...`,
                    mentions: [m.sender]
                },
                { quoted: m }
            );
            
            // Send audio
            await supreme.sendMessage(
                m.chat,
                {
                    audio: { url: audioUrl },
                    mimetype: "audio/mpeg",
                    fileName: `${title.substring(0, 50)}.mp3`
                },
                { quoted: m }
            );
            
        } catch (err) {
            console.error(err);
            reply(`❌ Error: ${err.message}`);
        }
    }
},
{
    command: ['play2',],
    operate: async ({ supreme, m, reply, text, prefix,  mess, command }) => {
        
        if (!text) return reply("❌ *Please provide a song name!*\nExample: `.play2 despacito`");
        
        try {
            const searchQuery = text.trim();
            
            if (!searchQuery) {
                return reply("❌ *Please provide a song name!*\nExample: `.play2 despacito`");
            }
            
            // React with 🎵 emoji
            await supreme.sendMessage(m.chat, {
                react: {
                    text: "🎵",
                    key: m.key
                }
            });
            
            // Search YouTube
            const { videos } = await yts(searchQuery);
            if (!videos || videos.length === 0) {
                return reply("⚠️ *No results found for your query!*");
            }
            
            // Use first video
            const video = videos[0];
            const videoUrl = video.url;
            
            // Send video info before download
            await reply("⏳ *Searching and downloading audio... Please wait*");
            
            await supreme.sendMessage(m.chat, {
                image: { url: video.thumbnail },
                caption: `*${video.title}*\n⏱ *Duration:* ${video.timestamp}\n👁 *Views:* ${video.views.toLocaleString()}\n\n⏳ *Downloading audio...*`
            }, { quoted: m });
            
            // Call the API with ?url= style
            const apiUrl = `https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(videoUrl)}`;
            const response = await axios.get(apiUrl);
            const data = response.data;
            
            if (!data?.status) {
                return reply("🚫 *Failed to fetch audio from API. Try again later.*");
            }
            
            // The API returns fields: title, thumbnail, audio, videos, etc.
            const audioUrl = data.audio;
            const title = data.title || video.title;
            
            if (!audioUrl) {
                return reply("🚫 *No audio URL found in the response.*");
            }
            
            // Send the audio file
            await supreme.sendMessage(m.chat, {
                audio: { url: audioUrl },
                mimetype: "audio/mpeg",
                fileName: `${title.replace(/[^\w\s]/gi, '')}.mp3`,
                ptt: false
            }, { quoted: m });
            
        } catch (error) {
            console.error('Error in play2 command:', error);
            reply("❌ *Download failed. Please try again later.*");
        }
    }
},
{
        command: ['play'],
        operate: async ({ supreme, m, reply, args, text }) => {
            await playCommand(supreme, m.chat, m, args);
        }
    },
    
    // Instagram command
    {
        command: ['instagram', 'ig', 'insta'],
        operate: async ({ supreme, m, reply, args, text }) => {
            await InstagramCommand(supreme, m.chat, m);
        }
    },
    
    // MediaFire command
    {
        command: ['mediafire', 'mf', 'mfire'],
        operate: async ({ supreme, m, reply, args, text }) => {
            await handleMediafireDownload(supreme, m.chat, m);
        }
    },
    
    // YTPlay command
    {
        command: ['ytplay', 'yplay', 'youtubeplay'],
        operate: async ({ supreme, m, reply, args, text }) => {
            const query = args.join(' ') || text;
            await ytplayCommand(supreme, m.chat, query, m);
        }
    },
    
    // Video command
    {
        command: ['video', 'ytvideo', 'youtubevideo'],
        operate: async ({ supreme, m, reply, args, text }) => {
            await videoCommand(supreme, m.chat, m);
        }
    },
    {
        command: ['song2',  'music'],
        operate: async ({ supreme, m, reply, text, fetchMp3DownloadUrl }) => {
            if (!text) return reply('*Please provide a song name!*');

            try {
                const search = await yts(text);
                if (!search || search.all.length === 0) return reply('*The song you are looking for was not found.*');

                const video = search.all[0];
                const downloadUrl = await fetchMp3DownloadUrl(video.url);

                await supreme.sendMessage(m.chat, {
                    audio: { url: downloadUrl },
                    mimetype: 'audio/mpeg',
                    fileName: `${video.title}.mp3`
                }, { quoted: m });

            } catch (error) {
                console.error('song2 command failed:', error);
                reply(`Error: ${error.message}`);
            }
        }
    },
    {
        command: ['gitclone', 'githubclone', 'gitdl'],
        operate: async ({ supreme, m, reply, args, text }) => {
            if (!text) return reply("*Please provide gitHub repository link*");
            
            let regex = /(?:https|git)(?::\/\/|@)github\.com[\/:]([^\/:]+)\/(.+)/i;
            if (!regex.test(text)) return reply("*Invalid link*");
            
            try {
                let [, user, repo] = args[0].match(regex) || [];
                repo = repo.replace(/.git$/, '');
                let url = `https://api.github.com/repos/${user}/${repo}/zipball`;
                
                let filename = (await fetch(url, {method: 'HEAD'})).headers.get('content-disposition').match(/attachment; filename=(.*)/)[1];
                
                supreme.sendMessage(m.chat, { 
                    document: { url: url }, 
                    mimetype: 'application/zip', 
                    fileName: `${filename}`
                }, { quoted: m });
                
            } catch (e) {
                await reply(`*Error! Repository Not Found*`);
            }
        }
    },
    {
        command: ['download', 'dl', 'filedownload'],
        operate: async ({ supreme, m, reply, text }) => {
            if (!text) return reply('Enter download URL');
            
            try {
                let res = await fetch(text, { method: 'GET', redirect: 'follow' });
                let contentType = res.headers.get('content-type');
                let buffer = await res.arrayBuffer();
                let extension = contentType.split('/')[1]; 
                let filename = res.headers.get('content-disposition')?.match(/filename="(.*)"/)?.[1] || `download-${Math.random().toString(36).slice(2, 10)}.${extension}`;

                let mimeType;
                switch (contentType) {
                    case 'audio/mpeg':
                        mimeType = 'audio/mpeg';
                        break;
                    case 'image/png':
                        mimeType = 'image/png';
                        break;
                    case 'image/jpeg':
                        mimeType = 'image/jpeg';
                        break;
                    case 'application/pdf':
                        mimeType = 'application/pdf';
                        break;
                    case 'application/zip':
                        mimeType = 'application/zip';
                        break;
                    case 'video/mp4':
                        mimeType = 'video/mp4';
                        break;
                    case 'video/webm':
                        mimeType = 'video/webm';
                        break;
                    case 'application/vnd.android.package-archive':
                        mimeType = 'application/vnd.android.package-archive';
                        break;
                    default:
                        mimeType = 'application/octet-stream';
                }

                supreme.sendMessage(m.chat, { 
                    document: Buffer.from(buffer), 
                    mimetype: mimeType, 
                    fileName: filename 
                }, { quoted: m });
                
            } catch (error) {
                reply(`Error downloading file: ${error.message}`);
            }
        }
    },
    {
        command: ['apk', 'androidapk', 'downloadapk'],
        operate: async ({ supreme, m, reply, fetchJson, text, botNumber }) => {
            if (!text) return reply("*Which apk do you want to download?*");
            
            try {
                const botname = global.botname || 'ＭＡＹＡ - ＸＭＤ';
                let apiUrl = await fetchJson(`https://api.bk9.dev/search/apk?q=${text}`);
                let kelvinData = await fetchJson(`https://api.bk9.dev/download/apk?id=${apiUrl.BK9[0].id}`);

                await supreme.sendMessage(
                    m.chat,
                    {
                        document: { url: kelvinData.BK9.dllink },
                        fileName: kelvinData.BK9.name,
                        mimetype: "application/vnd.android.package-archive",
                        contextInfo: {
                            externalAdReply: {
                                title: botname,
                                body: `${kelvinData.BK9.name}`,
                                thumbnailUrl: `${kelvinData.BK9.icon}`,
                                sourceUrl: `${kelvinData.BK9.dllink}`,
                                mediaType: 2,
                                showAdAttribution: true,
                                renderLargerThumbnail: true
                            }
                        }
                    },
                    { quoted: m }
                );
            } catch (error) {
                console.error(error);
                reply(global.mess?.error || "*Failed to download APK*");
            }
        }
    },
    {
        command: ['gdrive', 'googledrive', 'gdrivedl'],
        operate: async ({ supreme, m, reply, text }) => {
            if (!text) return reply("*Please provide a Google Drive file URL*");

            try {
                const siputzx = global.siputzx || 'https://api.siputzx.my.id';
                let response = await fetch(`${siputzx}/api/d/gdrive?url=${encodeURIComponent(text)}`);
                let data = await response.json();

                if (response.status !== 200 || !data.status || !data.data) {
                    return reply("*Please try again later or try another command!*");
                }

                const downloadUrl = data.data.download;
                const filePath = path.join(__dirname, `${Date.now()}_${data.data.name}`);

                const writer = fs.createWriteStream(filePath);
                const fileResponse = await axios({
                    url: downloadUrl,
                    method: 'GET',
                    responseType: 'stream'
                });

                fileResponse.data.pipe(writer);

                writer.on('finish', async () => {
                    await supreme.sendMessage(m.chat, {
                        document: fs.readFileSync(filePath),
                        fileName: data.data.name,
                        mimetype: fileResponse.headers['content-type'] || 'application/octet-stream'
                    }, { quoted: m });

                    fs.unlinkSync(filePath);
                });

                writer.on('error', (err) => {
                    console.error('Error downloading the file:', err);
                    reply("An error occurred while downloading the file.");
                });

            } catch (error) {
                console.error('Error fetching Google Drive file details:', error);
                reply(global.mess?.error || "*Failed to download from Google Drive*");
            }
        }
    },
    {
        command: ['savestatus', 'save', 'savestatis'],
        operate: async ({ supreme, m, reply, saveStatusMessage }) => {
            try {
                await saveStatusMessage(m);
            } catch (error) {
                console.error('Save status command error:', error);
                reply('❌ Failed to save status message.');
            }
        }
    },
    {
        command: ['ringtone', 'rtone', 'ringtones'],
        operate: async ({ supreme, m, reply, args, from }) => {
            try {
                const query = args.join(" ");
                if (!query) {
                    return reply("Please provide a search query! Example: .ringtone Suna");
                }

                const { data } = await axios.get(`https://www.dark-yasiya-api.site/download/ringtone?text=${encodeURIComponent(query)}`);

                if (!data.status || !data.result || data.result.length === 0) {
                    return reply("No ringtones found for your query. Please try a different keyword.");
                }

                const randomRingtone = data.result[Math.floor(Math.random() * data.result.length)];

                await supreme.sendMessage(
                    from,
                    {
                        audio: { url: randomRingtone.dl_link },
                        mimetype: "audio/mpeg",
                        fileName: `${randomRingtone.title}.mp3`,
                    },
                    { quoted: m }
                );
            } catch (error) {
                console.error("Error in ringtone command:", error);
                reply("Sorry, something went wrong while fetching the ringtone. Please try again later.");
            }
        }
    },
    {
        command: ['playdoc', 'songdoc', 'musicdoc'],
        operate: async ({ supreme, m, reply, text, fetchMp3DownloadUrl }) => {
            if (!text) return reply('*Please provide a song name!*');

            try {
                const search = await yts(text);
                if (!search || search.all.length === 0) return reply('*The song you are looking for was not found.*');

                const video = search.all[0];
                const downloadUrl = await fetchMp3DownloadUrl(video.url);

                await supreme.sendMessage(m.chat, {
                    document: { url: downloadUrl },
                    mimetype: 'audio/mpeg',
                    fileName: `${video.title}.mp3`
                }, { quoted: m });

            } catch (error) {
                console.error('playdoc command failed:', error);
                reply(`Error: ${error.message}`);
            }
        }
    },
    {
        command: ['itunes', 'applemusic', 'apple'],
        operate: async ({ supreme, m, reply, text }) => {
            if (!text) return reply("*Please provide a song name*");
            
            try {
                let res = await fetch(`https://api.popcat.xyz/itunes?q=${encodeURIComponent(text)}`);
                if (!res.ok) {
                    throw new Error(`*API request failed with status ${res.status}*`);
                }
                let json = await res.json();
                let songInfo = `*Song Information:*\n\n• *Name:* ${json.name}\n• *Artist:* ${json.artist}\n• *Album:* ${json.album}\n• *Release Date:* ${json.release_date}\n• *Price:* ${json.price}\n• *Length:* ${json.length}\n• *Genre:* ${json.genre}\n• *URL:* ${json.url}`;
                
                if (json.thumbnail) {
                    await supreme.sendMessage(
                        m.chat,
                        { image: { url: json.thumbnail }, caption: songInfo },
                        { quoted: m }
                    );
                } else {
                    reply(songInfo);
                }
            } catch (error) {
                console.error(error);
                reply(global.mess?.error || "*Failed to fetch iTunes information*");
            }
        }
    },

    // TikTok command (version 1)
    {
        command: ['tiktok', 'tt'],
        operate: async ({ supreme, m, reply, text, prefix, command, botNumber }) => {
            if (!text) return reply(`Use : ${prefix + command} link`)
            
            try {
                await supreme.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });
                
                let data = await fg.tiktok(text);
                let json = data.result;
                let botname = `${global.botname}`;
                let caption = `[ TIKTOK - DOWNLOAD ]\n\n`;
                caption += `◦ *Id* : ${json.id}\n`;
                caption += `◦ *Username* : ${json.author.nickname}\n`;
                caption += `◦ *Title* : ${(json.title)}\n`;
                caption += `◦ *Like* : ${(json.digg_count)}\n`;
                caption += `◦ *Comments* : ${(json.comment_count)}\n`;
                caption += `◦ *Share* : ${(json.share_count)}\n`;
                caption += `◦ *Play* : ${(json.play_count)}\n`;
                caption += `◦ *Created* : ${json.create_time}\n`;
                caption += `◦ *Size* : ${json.size}\n`;
                caption += `◦ *Duration* : ${json.duration}`;
                
                if (json.images) {
                    json.images.forEach(async (k) => {
                        await supreme.sendMessage(m.chat, { image: { url: k }}, { quoted: m });
                    });
                } else {
                    supreme.sendMessage(m.chat, { 
                        video: { url: json.play }, 
                        mimetype: 'video/mp4', 
                        caption: caption 
                    }, { quoted: m });
                    
                    setTimeout(() => {
                        supreme.sendMessage(m.chat, { 
                            audio: { url: json.music }, 
                            mimetype: 'audio/mpeg' 
                        }, { quoted: m });
                    }, 3000);
                }
                
                await supreme.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
                
            } catch (error) {
                console.error('TikTok error:', error);
                await supreme.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
                reply('❌ Failed to download TikTok content.');
            }
        }
    },

   {
    command: ['facebook', 'fb'],
    operate: async ({ supreme, m, reply, text }) => {
        if (!text) return reply('Usage: .fb <facebook_url>');
        
        try {
            await reply('📥 Downloading...');
            
            const apiUrl = `https://api.giftedtech.co.ke/api/download/facebook?apikey=gifted&url=${encodeURIComponent(text)}`;
            const res = await fetch(apiUrl);
            const data = await res.json();
            
            if (data.result?.hd_video) {
                await supreme.sendMessage(m.chat, {
                    video: { url: data.result.hd_video },
                    caption: `> ${global.wm || ''}`
                }, { quoted: m });
            } else {
                reply('Download failed');
            }
        } catch {
            reply('Error downloading');
        }
    }
},
    // Twitter/X command
    {
        command: ['twitter', 'x'],
        operate: async ({ supreme, m, reply, text }) => {
            if (!text) return reply(`*Please provide Twitter link or url!*`);

            try {
                await supreme.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });

                const apiUrl = `https://api.siputzx.my.id/api/d/twitter?url=${encodeURIComponent(text)}`;
                const response = await fetch(apiUrl);
                const data = await response.json();

                if (data.status && data.data && data.data.downloadLink) {
                    await supreme.sendMessage(
                        m.chat,
                        {
                            video: { url: data.data.downloadLink },
                            mimetype: 'video/mp4',
                            caption: `*${data.data.videoTitle || 'Twitter Video'}*\n\n${global.wm || ''}`
                        },
                        { quoted: m }
                    );
                    
                    await supreme.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
                } else {
                    throw new Error('No video found');
                }
                
            } catch (error) {
                console.error('Twitter command error:', error);
                await supreme.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
                reply('❌ *Failed to download Twitter video. Check the URL.*');
            }
        }
    },

    // TikTok version 2
    {
        command: ['tiktok2', 'tt2'],
        operate: async ({ supreme, m, reply, args, fetchJson }) => {
            if (!args[0]) return reply('*Please provide a TikTok video url!*');
            
            try {
                await supreme.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });
                
                let apiUrl = await fetchJson(`https://api-aswin-sparky.koyeb.app/api/downloader/tiktok?url=${args[0]}`);
                
                await supreme.sendMessage(
                    m.chat,
                    {
                        caption: global.wm || '',
                        video: { url: apiUrl.data.video },
                        fileName: "video.mp4",
                        mimetype: "video/mp4",
                    },
                    { quoted: m }
                );
                
                await supreme.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
                
            } catch (error) {
                console.error(error);
                await supreme.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
                reply(global.mess?.error || "*Failed to download TikTok*");
            }
        }
    },

    // TikTok audio command
    {
        command: ['tiktokaudio', 'tta'],
        operate: async ({ supreme, m, reply, args, fetchJson }) => {
            if (!args[0]) return reply('*Please provide a TikTok audio url!*');
            
            try {
                await supreme.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });
                
                let apiUrl = await fetchJson(`https://api-aswin-sparky.koyeb.app/api/downloader/tiktok?url=${args[0]}`);
                
                await supreme.sendMessage(
                    m.chat,
                    {
                        audio: { url: apiUrl.data.audio },
                        fileName: "tiktok.mp3",
                        mimetype: "audio/mpeg",
                    },
                    { quoted: m }
                );
                
                await supreme.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
                
            } catch (error) {
                console.error(error);
                await supreme.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
                reply(global.mess?.error || "*Failed to download TikTok audio*");
            }
        }
    },
   {
    command: ['ytmp4', 'ytv'],
    operate: async ({ supreme, m, reply, text }) => {
        if (!text) return reply('.ytmp4 <YouTube URL>');
        
        try {
            await reply('⏳ Downloading video...');
            
            const apiUrl = `https://apiskeith.top/download/mp4?url=${encodeURIComponent(text)}`;
            const res = await axios.get(apiUrl);
            const data = res.data;
            
            if (data.status && data.result) {
                await supreme.sendMessage(m.chat, {
                    video: { url: data.result },
                    caption: `📹 *YouTube Video*\n\n${global.wm || ''}`
                }, { quoted: m });
            } else {
                reply('Failed to download video');
            }
            
        } catch (error) {
            console.error('ytmp4 error:', error);
            reply('Error: ' + error.message);
        }
    }
}   
    
];