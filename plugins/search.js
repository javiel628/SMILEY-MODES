const fs = require('fs');
const path = require('path');
const yts = require('yt-search');
const fetch = require("node-fetch");
const axios = require('axios');
const { playstoreSearch } = require('../start/supremeCmds/playstore.js'); 

async function tiktokSearch(query) {
    try {
        const searchUrl = `https://api.jerexd666.wongireng.my.id/search/tiktok?q=${encodeURIComponent(query)}`;
        
        const response = await fetch(searchUrl);
        const data = await response.json();
        
        if (!data.status || !data.result || data.result.length === 0) {
            return "No TikTok videos found for your search.";
        }
        
        const videos = data.result.slice(0, 5); // Limit to 5 results
        let result = `🎵 **TikTok Search Results for "${query}"**\n\n`;
        
        videos.forEach((video, index) => {
            result += `**${index + 1}. ${video.title}**\n`;
            result += `👤 Author: ${video.author.nickname}\n`;
            result += `❤️ Likes: ${video.digg_count.toLocaleString()}\n`;
            result += `▶️ Plays: ${video.play_count.toLocaleString()}\n`;
            result += `💬 Comments: ${video.comment_count}\n`;
            result += `🔗 Video URL: ${video.play}\n\n`;
        });
        
        return result;
        
    } catch (error) {
        console.error('TikTok search error:', error);
        return "❌ Error searching TikTok. Please try again later.";
    }
}

module.exports = [
    {
        command: ['shazam', 'identifymusic', 'musicid'],
        operate: async ({ supreme, m, reply, quoted, acr, mime }) => {
            
            if (!quoted || !/audio|video/.test(mime)) {
                return reply("Reply to an audio or video to identify music.");
            }
            
            try {
                const media = await m.quoted.download();
                const filePath = `./tmp/${m.sender}.${mime.split('/')[1]}`;
                fs.writeFileSync(filePath, media);
                
                const res = await acr.identify(fs.readFileSync(filePath));
                
                if (res.status.code != 0) {
                    throw new Error(res.status.msg);
                }

                // Check before accessing music[0]
                if (!res.metadata?.music || res.metadata.music.length === 0) {
                    return reply("No music identified in this audio/video.");
                }

                const { title, artists, album, release_date } = res.metadata.music[0];
                const resultText = `🎵 *Music Identified!*\n\n*Title:* ${title}\n*Artist(s):* ${artists.map(v => v.name).join(', ')}\n*Album:* ${album?.name || 'Unknown'}\n*Release Date:* ${release_date || 'Unknown'}`;
                
                reply(resultText);
                
            } catch (error) {
                console.error(error);
                reply("Error identifying music: " + error.message);
            }
        }
    },
        {
        command: ['ytsearch', 'youtubesearch', 'yts'],
        operate: async ({ supreme, m, reply, text, prefix, command }) => {
            if (!text) return reply(`📌 *Example: ${prefix + command} Eminem Godzilla*`);

            try {
                const searchResults = await yts(text);
                if (!searchResults.all.length) return reply("❌ *No YouTube results found.*");

                let responseText = `🎥 *YouTube Search Results for:* ${text}\n\n`;
                searchResults.all.slice(0, 10).forEach((video, index) => {
                    responseText += `□ *${index + 1}.* ${video.title}\n□ *Uploaded:* ${video.ago}\n□ *Views:* ${video.views}\n□ *Duration:* ${video.timestamp}\n□ *URL:* ${video.url}\n\n─────────────────\n\n`;
                });

                await supreme.sendMessage(
                    m.chat,
                    { image: { url: searchResults.all[0].thumbnail }, caption: responseText },
                    { quoted: m }
                );
            } catch (error) {
                console.error("YT Search command failed:", error);
                reply("❌ *An error occurred while fetching YouTube search results.*");
            }
        }
    },
        {
        command: ['imdb', 'movie'],
        operate: async ({ supreme, m, reply, text }) => {
            if (!text) return reply("Provide a movie or series name.");
            
            try {
                const { data } = await axios.get(`http://www.omdbapi.com/?apikey=742b2d09&t=${text}&plot=full`);
                if (data.Response === "False") throw new Error();

                const imdbText = `🎬 *IMDB SEARCH*\n\n`
                    + `*Title:* ${data.Title}\n*Year:* ${data.Year}\n*Rated:* ${data.Rated}\n`
                    + `*Released:* ${data.Released}\n*Runtime:* ${data.Runtime}\n*Genre:* ${data.Genre}\n`
                    + `*Director:* ${data.Director}\n*Actors:* ${data.Actors}\n*Plot:* ${data.Plot}\n`
                    + `*IMDB Rating:* ${data.imdbRating} ⭐\n*Votes:* ${data.imdbVotes}`;

                supreme.sendMessage(m.chat, { image: { url: data.Poster }, caption: imdbText }, { quoted: m });
            } catch (error) {
                reply("❌ Unable to fetch IMDb data.");
            }
        }
    },
    {
        command: ['playstore', 'appstore', 'apps'],
        operate: async ({ supreme, m, reply, text }) => {
            if (!text) return reply('*Please provide an app name to search!*\nExample: .playstore WhatsApp');

            try {
              
                // Get search results
                const result = await playstoreSearch(text);
                
                // Send the results
                reply(result);
                
            } catch (error) {
                console.error('PlayStore plugin error:', error);
                reply('An error occurred while searching PlayStore.');
            }
        }
    },
{
    command: ['lyrics', 'lyric'],
    operate: async ({ supreme, m, reply, text, prefix }) => {
       if (!text) {
            return reply(`🎵 *Lyrics Finder*\n\nUsage: ${prefix}lyrics <song name>\n\nExamples:\n• ${prefix}lyrics shape of you\n• ${prefix}lyrics Sekkle down by bunnie Gunter\n• ${prefix}lyrics Blinding Lights The Weeknd`);
        }

        try {
            await reply(`🔍 Searching lyrics for: *"${text}"*...`);

            const apiUrl = `https://api.popcat.xyz/v2/lyrics?song=${encodeURIComponent(text)}`;
            const res = await fetch(apiUrl, { timeout: 15000 });
            
            if (!res.ok) throw new Error(`API status: ${res.status}`);
            
            const data = await res.json();

            // Check for error flag
            if (data.error === true) {
                return reply(`No lyrics found for *"${text}"*\n\nTry:\n• Add artist name\n• Check spelling\n• Use exact title`);
            }

            
            if (!data.message || typeof data.message !== 'object' || !data.message.lyrics) {
                return reply(`Lyrics not available for *"${text}"*`);
            }

            const lyricsData = data.message;
            const lyrics = lyricsData.lyrics;
            const artist = lyricsData.artist || 'Unknown';
            const title = lyricsData.title || text;
            const image = lyricsData.image;

            // Clean up lyrics (remove "Contributor" line if present)
            const cleanLyrics = lyrics.replace(/^\d+\s+Contributor.*?\n/i, '');

            // Format message (max 4000 chars for WhatsApp)
            let message = `🎵 *${title}*\n🎤 *Artist:* ${artist}\n\n📖 *Lyrics:*\n\n${cleanLyrics}`;
            
            if (message.length > 3500) {
                message = message.substring(0, 3500) + '\n\n*Lyrics truncated - song too long*';
            }
            
            message += `\n\n${global.wm || ''}`;

            // Send image first if available
            if (image && typeof image === 'string' && image.includes('http') && !image.includes('default_cover_image')) {
                try {
                    await supreme.sendMessage(m.chat, {
                        image: { url: image },
                        caption: `🎵 *${title}*\n🎤 *Artist:* ${artist}`
                    }, { quoted: m });
                    
                    // Small delay
                    await new Promise(resolve => setTimeout(resolve, 300));
                } catch (e) {
                    console.log('Image failed:', e.message);
                }
            }

            // Send lyrics
            await supreme.sendMessage(m.chat, { text: message }, { quoted: m });

        } catch (error) {
            console.error('Lyrics error:', error);
            
            let errMsg = `Error: ${error.message}`;
            if (error.message.includes('timeout')) errMsg = 'Request timed out';
            if (error.message.includes('network')) errMsg = 'Network error';
            if (error.message.includes('status: 5')) errMsg = 'Service unavailable';
            
            reply(`${errMsg}\n\nTry again in a few moments!`);
        }
     }
}, 
    {
        command: ['chord', 'cr'],
        operate: async ({ reply, m, text }) => {
            if (!text) return reply(`*Query input needed*\n\nExample: .chord shape of you`);
            
            try {
                const apiUrl = `https://api.diioffc.web.id/api/search/chord?query=${encodeURIComponent(text)}`;
                const res = await fetch(apiUrl);
                const response = await res.json();
                
                if (!response.result) {
                    return reply(`❌ No chord found for "${text}"\nPlease try a different song.`);
                }
                
                const { url, artist, artistUrl, title, chord } = response.result;
                
                // Format chord output with better readability
                const chordMessage = `🎵 *Chord Finder*\n\n` +
                    `🎤 *Title:* ${title}\n` +
                    `👤 *Artist:* ${artist}\n` +
                    `🔗 *Artist URL:* ${artistUrl}\n` +
                    `🌐 *Chord URL:* ${url}\n\n` +
                    `🎼 *Chord:*\n\`\`\`\n${chord}\n\`\`\``;
                
                reply(chordMessage);
                
            } catch (error) {
                console.error('Error in chord command:', error);
                reply('Error fetching chord. Please try again later.');
            }
        }
    },
        {
        command: ['weather'],
        operate: async ({ reply, m, supreme, text }) => {
            if (!text) return reply("Provide a location.");
            
            try {
                const { data } = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${text}&units=metric&appid=060a6bcfa19809c2cd4d97a212b19273`);
                
                const weatherInfo = `🌤️ *Weather for ${text}*\n\n`
                    + `🌡️ *Temperature:* ${data.main.temp}°C (Feels like ${data.main.feels_like}°C)\n`
                    + `🌪️ *Weather:* ${data.weather[0].main} - ${data.weather[0].description}\n`
                    + `💨 *Wind Speed:* ${data.wind.speed} m/s\n`
                    + `📍 *Coordinates:* ${data.coord.lat}, ${data.coord.lon}\n`
                    + `🌍 *Country:* ${data.sys.country}`;

                supreme.sendMessage(m.chat, { text: weatherInfo }, { quoted: m });
            } catch (error) {
                reply("❌ Unable to fetch weather data.");
            }
        }
    },
    {
        command: ['tiktoksearch', 'tts'],
        operate: async ({ reply, m, supreme, text }) => {
            const query = text.trim();
            if (!query) return reply("*Provide TikTok username or search query*.");
            
            await supreme.sendMessage(m.chat, { 
                text: `🔍 Searching TikTok for "${query}"...` 
            }, { quoted: m });
            
            const result = await tiktokSearch(query);
            await supreme.sendMessage(m.chat, { text: result }, { quoted: m });
        }
    },
        {
        command: ['define'],
        operate: async ({ supreme, mek, m, reply, text, q }) => {
        try {
        if (!q) return reply("Please provide a word to define.\n\n📌 *Usage:* .define [word]");

        const word = q.trim();
        const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;

        const response = await axios.get(url);
        const definitionData = response.data[0];

        const definition = definitionData.meanings[0].definitions[0].definition;
        const example = definitionData.meanings[0].definitions[0].example || '❌ No example available';
        const synonyms = definitionData.meanings[0].definitions[0].synonyms.join(', ') || '❌ No synonyms available';
        const phonetics = definitionData.phonetics[0]?.text || '🔇 No phonetics available';
        const audio = definitionData.phonetics[0]?.audio || null;

        const wordInfo = `
📖 *Word*: *${definitionData.word}*  
🗣️ *Pronunciation*: _${phonetics}_  
📚 *Definition*: ${definition}  
✍️ *Example*: ${example}  
📝 *Synonyms*: ${synonyms}  

> ${global.wm}`;

        if (audio) {
            await supreme.sendMessage(from, { audio: { url: audio }, mimetype: 'audio/mpeg' }, { quoted: mek });
        }

        return reply(wordInfo);
    } catch (e) {
        console.error("❌ Error:", e);
        if (e.response && e.response.status === 404) {
            return reply("🚫 *Word not found.* Please check the spelling and try again.");
        }
        return reply("⚠️ An error occurred while fetching the definition. Please try again later.");
    }
  }
},
{
        command: ['news'],
        operate: async ({ supreme, mek, m, from, reply, text, q }) => {
        try {
        const apiKey="0f2c43ab11324578a7b1709651736382";
        const response = await axios.get(`https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}`);
        const articles = response.data.articles;

        if (!articles.length) return reply("No news articles found.");

        // Send each article as a separate message with image and title
        for (let i = 0; i < Math.min(articles.length, 5); i++) {
            const article = articles[i];
            let message = `
📰 *${article.title}*
⚠️ _${article.description}_
🔗 _${article.url}_

> ${global.wm}
            `;

            console.log('Article URL:', article.urlToImage); 

            if (article.urlToImage) {
                // Send image with caption
                await supreme.sendMessage(from, { image: { url: article.urlToImage }, caption: message });
            } else {
                
                await supreme.sendMessage(from, { text: message });
            }
        };
    } catch (e) {
        console.error("Error fetching news:", e);
        reply("Could not fetch news. Please try again later.");
    }
  }
},
{
        command: ['searchrepo', 'srepo'],
        operate: async ({ supreme, mek, m, args, store, from, reply, text, q }) => {
        try {
    const repoName = args.join(" ");
    if (!repoName) {
      return reply("Please provide a GitHub repository in the format 📌 `owner/repo`.");
    }

    const apiUrl = `https://api.github.com/repos/${repoName}`;
    const { data } = await axios.get(apiUrl);

    let responseMsg = `📁 *GitHub Repository Info* 📁\n\n`;
    responseMsg += `*Name*: ${data.name}\n`;
    responseMsg += `*URL*: ${data.html_url}\n`;
    responseMsg += `*Description*: ${data.description || "No description"}\n`;
    responseMsg += `*Stars*: ${data.stargazers_count}\n`;
    responseMsg += `*Forks*: ${data.forks_count}\n`;
    responseMsg += `*Owner*: ${data.owner.login}\n`;
    responseMsg += `*Created At*: ${new Date(data.created_at).toLocaleDateString()}\n`;
    responseMsg += `\n> ${global.wm}`;

    await supreme.sendMessage(from, { text: responseMsg }, { quoted: m });
  } catch (error) {
    console.error("GitHub API Error:", error);
    reply(`❌ Error fetching repository data: ${error.response?.data?.message || error.message}`);
  }
 }
},
{
        command: ['ytstalk'],
        operate: async ({ supreme, mek, m, args, reply, from, text, q }) => {
        try {
    const username = args.join(" ");
    if (!username) {
      return reply("Please provide a YouTube username. Example: `.ytstalk smile-hub`");
    }

    // Fetch YouTube channel information from the API
    const response = await axios.get(`https://api.siputzx.my.id/api/stalk/youtube?username=${encodeURIComponent(username)}`);
    const { status, data } = response.data;

    if (!status || !data) {
      return reply("No information found for the specified YouTube channel. Please try again.");
    }

    const {
      channel: {
        username: ytUsername,
        subscriberCount,
        videoCount,
        avatarUrl,
        channelUrl,
        description,
      },
      latest_videos,
    } = data;

    // Format the YouTube channel information message
    const ytMessage = `
📺 *YouTube Channel*: ${ytUsername}
👥 *Subscribers*: ${subscriberCount}
🎥 *Total Videos*: ${videoCount}
📝 *Description*: ${description || "N/A"}
🔗 *Channel URL*: ${channelUrl}

🎬 *Latest Videos*:
${latest_videos.slice(0, 3).map((video, index) => `
${index + 1}. *${video.title}*
   ▶️ *Views*: ${video.viewCount}
   ⏱️ *Duration*: ${video.duration}
   📅 *Published*: ${video.publishedTime}
   🔗 *Video URL*: ${video.videoUrl}
`).join("\n")}
    `;


    await supreme.sendMessage(from, {
      image: { url: avatarUrl }, 
      caption: ytMessage, 
    });
  } catch (error) {
    console.error("Error fetching YouTube channel information:", error);
    reply("❌ Unable to fetch YouTube channel information. Please try again later.");
  }
 }
},
{
        command: ['twitterstalk', 'xstalk'],
        operate: async ({ supreme, mek, m, q, reply, from, text }) => {
        try {
    if (!q) {
      return reply("Please provide a valid Twitter/X username.");
    }

    await supreme.sendMessage(from, {
      react: { text: "⏳", key: m.key }
    });

    const apiUrl = `https://delirius-apiofc.vercel.app/tools/xstalk?username=${encodeURIComponent(q)}`;
    const { data } = await axios.get(apiUrl);

    if (!data || !data.status || !data.data) {
      return reply("⚠️ Failed to fetch Twitter/X user details. Ensure the username is correct.");
    }

    const user = data.data;
    const verifiedBadge = user.verified ? "✅" : "❌";

    const caption = `╭━━━〔 *TWITTER/X STALKER* 〕━━━⊷\n`
      + `┃👤 *Name:* ${user.name}\n`
      + `┃🔹 *Username:* @${user.username}\n`
      + `┃✔️ *Verified:* ${verifiedBadge}\n`
      + `┃👥 *Followers:* ${user.followers_count}\n`
      + `┃👤 *Following:* ${user.following_count}\n`
      + `┃📝 *Tweets:* ${user.tweets_count}\n`
      + `┃📅 *Joined:* ${user.created}\n`
      + `┃🔗 *Profile:* [Click Here](${user.url})\n`
      + `╰━━━⪼\n\n`
      + `🔹 > ${global.wm}`;

    await supreme.sendMessage(from, {
      image: { url: user.avatar },
      caption: caption
    }, { quoted: m });

  } catch (error) {
    console.error("Error:", error);
    reply("❌ An error occurred while processing your request. Please try again.");
  }
 }
}
];