const { truthCommand, dareCommand } = require('../start/supremeCmds/fun.js');

function getCompatibilityMessage(score) {
    if (score >= 900) return "Soulmates! 💞 You're perfect for each other!";
    if (score >= 700) return "Great match! 💕 You complement each other well.";
    if (score >= 500) return "Good potential! 💗 With some work, this could be great.";
    if (score >= 300) return "Not bad! 💖 There's some chemistry here.";
    return "Might need some work... 💔 But don't give up!";
}

module.exports = [
    {
        command: ['truth', 't', 'question'],
        operate: async ({ supreme, m, reply }) => {
            try {
                await truthCommand(supreme, m.chat, m);
            } catch (error) {
                console.error('Truth command error:', error);
                reply('❌ Error executing truth command.');
            }
        }
    },
    {
        command: ['dare', 'd', 'challenge'],
        operate: async ({ supreme, m, reply }) => {
            try {
                await dareCommand(supreme, m.chat, m);
            } catch (error) {
                console.error('Dare command error:', error);
                reply('❌ Error executing dare command.');
            }
        }
    },
    {
        command: ['compatibility', 'comp'],
        operate: async ({ supreme, m, reply, botNumber }) => {
            try {
                // Check if two users are mentioned
                if (!m.mentionedJid || m.mentionedJid.length < 2) {
                    return reply("Please mention two users to calculate compatibility.\nUsage: `.compatibility @user1 @user2`");
                }

                const [user1, user2] = m.mentionedJid.slice(0, 2);
                
                // Calculate random compatibility score (1-1000)
                let compatibilityScore = Math.floor(Math.random() * 1000) + 1;

                // Special case for bot owner
                const ownerNumber = botNumber.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                if (user1 === ownerNumber || user2 === ownerNumber) {
                    compatibilityScore = 1000;
                }

                // Format the response
                const resultMessage = 
                    `💖 *Compatibility Result* 💖\n\n` +
                    `@${user1.split('@')[0]} ❤️ @${user2.split('@')[0]}\n` +
                    `Score: ${compatibilityScore}/1000\n\n` +
                    `${getCompatibilityMessage(compatibilityScore)}`;

                // Send the result
                await supreme.sendMessage(
                    m.chat,
                    { 
                        text: resultMessage,
                        mentions: [user1, user2]
                    },
                    { quoted: m }
                );

            } catch (error) {
                console.error('Error in compatibility command:', error);
                reply(`❌ Error: ${error.message}`);
            }
        }
    },
        {
        command: ['lovetest', 'love', 'compatibility'],
        operate: async ({ supreme, m, reply, args }) => {
            if (args.length < 2) return reply("Tag two users! Example: .lovetest @user1 @user2");

            let user1 = args[0].replace("@", "") + "@s.whatsapp.net";
            let user2 = args[1].replace("@", "") + "@s.whatsapp.net";

            let lovePercent = Math.floor(Math.random() * 100) + 1;

            let messages = [
                { range: [90, 100], text: "💖 *A match made in heaven!* True love exists!" },
                { range: [75, 89], text: "😍 *Strong connection!* This love is deep and meaningful." },
                { range: [50, 74], text: "😊 *Good compatibility!* You both can make it work." },
                { range: [30, 49], text: "🤔 *It's complicated!* Needs effort, but possible!" },
                { range: [10, 29], text: "😅 *Not the best match!* Maybe try being just friends?" },
                { range: [1, 9], text: "💔 *Uh-oh!* This love is as real as a Bollywood breakup!" }
            ];

            let loveMessage = messages.find(msg => lovePercent >= msg.range[0] && lovePercent <= msg.range[1]).text;

            let message = `💘 *Love Compatibility Test* 💘\n\n❤️ *@${user1.split("@")[0]}* + *@${user2.split("@")[0]}* = *${lovePercent}%*\n${loveMessage}`;

            await supreme.sendMessage(m.chat, { 
                text: message, 
                mentions: [user1, user2] 
            }, { quoted: m });
        }
    },
    {
        command: ['jokes', 'joke', 'funny'],
        operate: async ({ supreme, m, reply }) => {
            try {
                let res = await fetch("https://official-joke-api.appspot.com/random_joke");
                let json = await res.json();
                const joke = `${json.setup}\n\n${json.punchline}`;
                await supreme.sendMessage(m.chat, { text: joke }, { quoted: m });
            } catch (error) {
                console.error('Error fetching joke:', error);
                reply('An error occurred while fetching a joke.');
            }
        }
    },
    {
        command: ['valentines', 'valentine'],
        operate: async ({ supreme, m, reply }) => {
            try {
                let res = await fetch("https://api.giftedtech.co.ke/api/fun/valentines?apikey=gifted");
                
                if (!res.ok) {
                    throw new Error(`API request failed with status ${res.status}`);
                }
                
                let json = await res.json();
                
                if (json && json.success && json.result) {
                    await supreme.sendMessage(m.chat, { text: `💝 ${json.result}` }, { quoted: m });
                } else {
                    throw new Error('Invalid API response structure');
                }
                
            } catch (error) {
                console.error('Error fetching valentine message:', error);
                reply('Sorry, I couldn\'t fetch a valentine message at the moment. Please try again later.');
            }
        }
    },
    {
        command: ['pickupline', 'pickup', 'flirt'],
        operate: async ({ supreme, m, reply, botNumber }) => {
            try {
                const res = await fetch('https://api.popcat.xyz/pickuplines');
                
                if (!res.ok) {
                    throw new Error(`API request failed with status ${res.status}`);
                }

                const json = await res.json();
                const botname = getSetting(botNumber, 'botname', 'ＭＡＹＡ - ＸＭＤ');
                const pickupLine = `*Here's a pickup line for you:*\n\n"${json.pickupline}"\n\n> *© Dropped by ${botname}*`;

                await supreme.sendMessage(m.chat, { text: pickupLine }, { quoted: m });

            } catch (error) {
                console.error("Error in pickupline command:", error);
                reply("Sorry, something went wrong while fetching the pickup line. Please try again later.");
            }
        }
    },
    {
        command: ['advice', 'suggestion', 'tip'],
        operate: async ({ supreme, m, reply }) => {
            try {
                let res = await fetch("https://api.giftedtech.co.ke/api/fun/advice?apikey=gifted");
                if (!res.ok) {
                    throw new Error(`API request failed with status ${res.status}`);
                }
                let json = await res.json();
                if (json && json.success && json.result) {
                    await supreme.sendMessage(m.chat, { text: `💡 Advice: ${json.result}` }, { quoted: m });
                } else {
                    throw new Error('Invalid API response structure');
                }
            } catch (error) {
                console.error('Error fetching advice:', error);
                reply('Sorry, I couldn\'t fetch an advice at the moment. Please try again later.');
            }
        }
    },
    {
        command: ['motivate', 'motivation', 'quote'],
        operate: async ({ supreme, m, reply }) => {
            try {
                let res = await fetch("https://api.giftedtech.co.ke/api/fun/motivate?apikey=gifted");
                if (!res.ok) {
                    throw new Error(`API request failed with status ${res.status}`);
                }
                let json = await res.json();
                if (json && json.success && json.result) {
                    await supreme.sendMessage(m.chat, { text: `💫 ${json.result}` }, { quoted: m });
                } else {
                    throw new Error('Invalid API response structure');
                }
            } catch (error) {
                console.error('Error fetching motivation:', error);
                reply('Sorry, I couldn\'t fetch a motivational quote at the moment. Please try again later.');
            }
        }
    },
        {
        command: ['mee', 'me', 'voice'],
        operate: async ({ supreme, m, reply }) => {
            const voiceClips = [
                "https://cdn.ironman.my.id/i/7p5plg.mp4",
                "https://cdn.ironman.my.id/i/rnptgd.mp4",
                "https://cdn.ironman.my.id/i/smsl2s.mp4",
                "https://cdn.ironman.my.id/i/vkvh1d.mp4",
                "https://cdn.ironman.my.id/i/9xp5lb.mp4",
                "https://cdn.ironman.my.id/i/jfr6cu.mp4",
                "https://cdn.ironman.my.id/i/l4dyvg.mp4",
                "https://cdn.ironman.my.id/i/4z93dg.mp4",
                "https://cdn.ironman.my.id/i/m9gwk0.mp4",
                "https://cdn.ironman.my.id/i/gr1jjc.mp4",
                "https://cdn.ironman.my.id/i/lbr8of.mp4",
                "https://cdn.ironman.my.id/i/0z95mz.mp4",
                "https://cdn.ironman.my.id/i/rldpwy.mp4",
                "https://cdn.ironman.my.id/i/lz2z87.mp4",
                "https://cdn.ironman.my.id/i/gg5jct.mp4"
            ];

            const randomClip = voiceClips[Math.floor(Math.random() * voiceClips.length)];
            const mentionedUser = m.sender;

            // Mention user with text first
            await supreme.sendMessage(m.chat, {
                text: `@${mentionedUser.split('@')[0]}`,
                mentions: [mentionedUser]
            });

            // Send Voice Note
            await supreme.sendMessage(m.chat, {
                audio: { url: randomClip },
                mimetype: 'audio/mp4',
                ptt: true,
                waveform: [99, 0, 99, 0, 99],
                contextInfo: {
                    forwardingScore: 55555,
                    isForwarded: true,
                    externalAdReply: {
                        title: "ＭＡＹＡ - ＸＭＤ",
                        body: "𝐓𝝰̚𝐠͜͡𝗲 𝝪𝐨̚𝝻͜͡𝐫 𝐋𝝾̚𝝼͜͡𝗲 :🦚🍬⛱️🎗️💖",
                        mediaType: 4,
                        thumbnailUrl: "https://files.catbox.moe/ptpl5c.jpeg",
                        sourceUrl: "https://Wa.me/+254107065646",
                        showAdAttribution: true
                    }
                },
                mentions: [mentionedUser]
            });
        }
    },
    {
        command: ['character', 'char', 'personality'],
        operate: async ({ supreme, m, reply, isGroup, from }) => {
            try {
                if (!isGroup) {
                    return reply("This command can only be used in groups.");
                }

                const mentionedUser = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
                if (!mentionedUser) {
                    return reply("Please mention a user whose character you want to check.");
                }

                const userChar = [
                    "Sigma", "Generous", "Grumpy", "Overconfident", "Obedient",
                    "Good", "Simp", "Kind", "Patient", "Pervert", "Cool",
                    "Helpful", "Brilliant", "Sexy", "Single", "Hot", "Gorgeous", "Cute"
                ];

                const userCharacterSelection = userChar[Math.floor(Math.random() * userChar.length)];
                const message = `Character of @${mentionedUser.split("@")[0]} is *${userCharacterSelection}* 🔥⚡`;

                await supreme.sendMessage(from, {
                    text: message,
                    mentions: [mentionedUser],
                }, { quoted: m });

            } catch (e) {
                console.error("Error in character command:", e);
                reply("An error occurred while processing the command. Please try again.");
            }
        }
    },
    {
  command: ['trivia'],
  react: "❓",
  operate: async ({ supreme, m, reply }) => {
    try {
      let res = await fetch("https://opentdb.com/api.php?amount=1");
      let json = await res.json();

      let question = json.results[0].question;
      let answer = json.results[0].correct_answer;

      await supreme.sendMessage(m.chat, { text: `Question: ${question}\n\nThink you know the answer? Sending the correct answer after 20 seconds` }, { quoted: m });
      
      setTimeout(async () => {
        await supreme.sendMessage(m.chat, { text: `Answer: ${answer}` });
      }, 20000); // 20 seconds
    } catch (error) {
      console.error('Error fetching trivia question:', error);
      reply('An error occurred while fetching the trivia question.');
    }
  }
},
{
  command: ['truthdetector', 'liedetector'],
  react: "🕵️",
  operate: async ({ m, reply }) => {
    if (!m.quoted) return reply(`Please reply to the message you want to detect!`);

    let responses = [
      "That's a blatant lie!",
      "Truth revealed!",
      "Lie alert!",
      "Hard to believe, but true!",
      "Professional liar detected!",
      "Fact-check: TRUE",
      "Busted! That's a lie!",
      "Unbelievable, but FALSE!",
      "Detecting... TRUTH!",
      "Lie detector activated: FALSE!",
      "Surprisingly, TRUE!",
      "My instincts say... LIE!",
      "That's partially true!",
      "Can't verify, try again!",
      "Most likely, TRUE!",
      "Don't believe you!",
      "Surprisingly, FALSE!",
      "Truth!",
      "Honest as a saint!",
      "Deceptive much?",
      "Absolutely true!",
      "Completely false!",
      "Seems truthful.",
      "Not buying it!",
      "You're lying through your teeth!",
      "Hard to believe, but it's true!",
      "I sense honesty.",
      "Falsehood detected!",
      "Totally legit!",
      "Lies, lies, lies!",
      "You can't fool me!",
      "Screams truth!",
      "Fabrication alert!",
      "Spot on!",
      "Fishy story, isn't it?",
      "Unquestionably true!",
      "Pure fiction!"
    ];

    let result = responses[Math.floor(Math.random() * responses.length)];
    let replyText = `*RESULT*: ${result}`;

    await reply(replyText);
  }
}
    
];