const axios = require('axios');
const {
veniceAICommand,
mistralAICommand,
perplexityAICommand,
bardAICommand,
gpt4NanoAICommand,
kelvinAICommand,
claudeAICommand
} = require('../start/supremeCmds/ai');

module.exports = [
    // Generate AI Image
    {
        command: ['generate', 'genimage', 'aiimage'],
        operate: async ({ supreme, m, reply, text }) => {
            if (!text) return reply(global.mess?.notext || '*Please provide text to generate image*');
            
            const apiUrl = `https://api.gurusensei.workers.dev/dream?prompt=${encodeURIComponent(text)}`;
            try {
                await supreme.sendMessage(m.chat, { image: { url: apiUrl } }, { quoted: m });
            } catch (error) {
                console.error('Error generating image:', error);
                reply(global.mess?.error || '*Failed to generate image*');
            }
        }
    },

    // Copilot/Deepseek/AI (General AI)
    {
        command: ['copilot', 'deepseek', 'ai'],
        operate: async ({ supreme, m, reply, text, q }) => {
            const query = text || q;
            if (!query) return reply('*Please provide a question*.\nExample: .ai tell me a joke');
            
            try {
                const response = await fetch(`https://api.siputzx.my.id/api/ai/gpt3?prompt=${encodeURIComponent(query)}`);
                const data = await response.json();
                
                reply(data.status ? `🤖 ${data.data}` : 'AI failed to respond');
            } catch (error) {
                reply('❌ Error: AI service down');
            }
        }
    },

    // GPT
    {
        command: ['gpt'],
        operate: async ({ supreme, m, reply, text }) => {
            if (!text) return reply(global.mess?.notext || '*Please provide text*');
            
            try {
                const apiUrl = `${global.mess?.siputzx || 'https://api.siputzx.my.id'}/api/ai/gpt3?prompt=you%20are%20an%20helpful%20assistant%20providing%20detailed%20and%20friendly%20responses&content=${encodeURIComponent(text)}`;
                const response = await fetch(apiUrl);
                const result = await response.json();
                
                if (!result.status || !result.data) {
                    reply(global.mess?.error || '*Failed to get response*');
                } else {
                    reply(result.data);
                }
            } catch (error) {
                console.error('Error fetching response from GPT API:', error);
                reply(global.mess?.error || '*Failed to get response*');
            }
        }
    },

    // GPT2/AI/ChatGPT
    {
        command: ['gpt2', 'chatgpt'],
        operate: async ({ supreme, m, reply, text, prefix, command }) => {
            if (!text) return reply(`Please provide a query/question\n\nExample: ${prefix + command} what is artificial intelligence?`);
            
            try {
                // Send "typing..." indicator
                await supreme.sendPresenceUpdate('composing', m.chat);
                
                // Encode the query for the API
                const query = encodeURIComponent(text);
                const apiUrl = `https://api.giftedtech.co.ke/api/ai/ai?apikey=gifted&q=${query}`;
                
                // Fetch response from API
                const { data } = await axios.get(apiUrl);
                
                let response;
                
                if (data && data.result) {
                    response = data.result;
                } else if (data && data.message) {
                    response = data.message;
                } else {
                    response = "❌ Sorry, I couldn't process your request at the moment. Please try again later.";
                }
                
                // Format the response
                const finalResponse = `🤖 *GPT RESPONSE*\n\n${response}\n\n*Powered by Jexploit AI*`;
                
                reply(finalResponse);
                
            } catch (error) {
                console.error('GPT Command Error:', error);
                reply('❌ An error occurred while processing your request. Please try again later.');
            }
        }
    },

    // Meta AI
    {
        command: ['metaai'],
        operate: async ({ supreme, m, reply, text, prefix }) => {
            if (!text) return reply(`❌ *Please provide a question!*\n\n📌 *Example:* ${prefix}metaai Hello, how are you?`);

            try {
                // React while processing
                await supreme.sendMessage(m.chat, { react: { text: "💭", key: m.key } });

                // API URL
                const apiUrl = `https://api.nekolabs.web.id/text-generation/ai4chat?text=${encodeURIComponent(text)}`;
                
                // Fetch response from API
                const response = await fetch(apiUrl);
                const data = await response.json();

                if (data.success && data.result) {
                    // Format the response nicely
                    const replyText = `🤖 *AI Response*\n\n${data.result}\n\n⏱️ *Response Time:* ${data.responseTime || 'N/A'}`;
                    
                    await supreme.sendMessage(
                        m.chat,
                        { text: replyText },
                        { quoted: m }
                    );
                    
                    // Success reaction
                    await supreme.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
                } else {
                    throw new Error('No response from AI');
                }
                
            } catch (error) {
                console.error('Meta AI command error:', error);
                await supreme.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
                reply('❌ *Failed to get AI response. Please try again later.*');
            }
        }
    },

    // Llama AI
    {
        command: ['llama', 'llamaai'],
        operate: async ({ supreme, m, reply, text, q }) => {
            const query = text || q;
            if (!query) return reply('*Please ask me something*');
            
            try {
                const response = await fetch(`https://api.privatezia.biz.id/api/ai/deepai?query=${encodeURIComponent(query)}`);
                const data = await response.json();
                
                if (data.status && data.data) {
                    reply(`🤖 ${data.data}`);
                } else {
                    reply(data.status ? 'Response received but data field is empty' : 'API returned false status');
                }
                
            } catch (error) {
                console.error('Llama AI error:', error);
                reply('⚠️ Error processing your request');
            }
        }
    },

    // Blackbox AI
    {
        command: ['blackbox', 'bb'],
        operate: async ({ supreme, m, reply, text, q }) => {
            const query = text || q;
            if (!query) return reply('*Please ask me something*');
            
            try {
                const response = await fetch(`https://api.privatezia.biz.id/api/ai/blackbox?query=${encodeURIComponent(query)}`);
                const data = await response.json();
                
                if (data.status && data.data) {
                    reply(`🤖 ${data.data}`);
                } else {
                    reply(data.status ? 'Response received but data field is empty' : 'API returned false status');
                }
                
            } catch (error) {
                console.error('Blackbox AI error:', error);
                reply('⚠️ Error processing your request');
            }
        }
    },

    // DALL-E AI
    {
        command: ['dalle', 'luminai'],
        operate: async ({ supreme, m, reply, text, q }) => {
            const query = text || q;
            if (!query) return reply('*Please ask me something*');
            
            try {
                const response = await fetch(`https://api.privatezia.biz.id/api/ai/luminai?query=${encodeURIComponent(query)}`);
                const data = await response.json();
                
                if (data.status && data.data) {
                    reply(`🤖 ${data.data}`);
                } else {
                    reply(data.status ? 'Response received but data field is empty' : 'API returned false status');
                }
                
            } catch (error) {
                console.error('DALL-E AI error:', error);
                reply('⚠️ Error processing your request');
            }
        }
    },

    // Summarize AI
    {
        command: ['summarize', 'summary'],
        operate: async ({ supreme, m, reply, text, q }) => {
            const query = text || q;
            if (!query) return reply('*Please ask me something*');
            
            try {
                const response = await fetch(`https://api.privatezia.biz.id/api/ai/ai4chat?query=${encodeURIComponent(query)}`);
                const data = await response.json();
                
                if (data.status && data.data) {
                    reply(`🤖 ${data.data}`);
                } else {
                    reply(data.status ? 'Response received but data field is empty' : 'API returned false status');
                }
                
            } catch (error) {
                console.error('Summarize AI error:', error);
                reply('⚠️ Error processing your request');
            }
        }
    },

    // Mistral AI
    {
        command: ['mistral', 'mistralai'],
        operate: async ({ supreme, m, reply, text, q }) => {
            const query = text || q;
            if (!query) return reply('❌ Ask me something');
            
            try {
                const response = await fetch(`https://api.giftedtech.co.ke/api/ai/deepseek-r1?apikey=gifted&q=${encodeURIComponent(query)}`);
                const data = await response.json();
                
                reply(data.success ? `🔍 ${data.result}` : 'Mistral AI failed to respond');
            } catch (error) {
                reply('❌ Mistral AI service error');
            }
        }
    },
    {
        command: ['think'],
        operate: async ({ supreme, mek, m, reply, text, q }) => {
           try {
        if (!q) {
            return reply('Please provide a complex question for deep thinking mode.\n\nExample: .think analyze the ethical implications of artificial intelligence in healthcare');
        }

        await reply('_🧠 Microsoft Copilot is thinking deeply... This may take a moment._');

        const response = await axios.get(`https://malvin-api.vercel.app/ai/copilot-think?text=${encodeURIComponent(q)}`);
        
        if (response.data && response.data.result) {
            const answer = response.data.result;
            
            await supreme.sendMessage(from, {
                text: `🧠 *Microsoft Copilot - Deep Thinking:*\n\n${answer}\n\n💭 *Deep analysis completed*\n👤 *Requested by:* @${sender.split('@')[0]}`,
                mentions: [sender],
                contextInfo: {
                    mentionedJid: [sender],
                    quotedMessage: mek.message
                }
            }, {
                quoted: m
            });
        } else {
            throw new Error('Invalid response from Copilot Deep Thinking API');
        }

    } catch (error) {
        console.error('Error in think command:', error);
        
        if (error.code === 'ECONNABORTED') {
            await reply('❌ Request timeout. Deep thinking is taking longer than expected. Please try again.');
        } else if (error.response?.status === 429) {
            await reply('❌ Rate limit exceeded. Please wait before another deep thinking request.');
        } else {
            await reply('❌ Failed to get deep thinking response. Please try again later.');
        }
    }
 }
},
    {
        command: ['venice', 'vai'],
        operate: async ({ supreme, m, reply, args, text }) => {
            await veniceAICommand(supreme, m.chat, text, m);
        }
    },
    {
        command: ['mistral'],
        operate: async ({ supreme, m, reply, args, text }) => {
            await mistralAICommand(supreme, m.chat, text, m);
        }
    },
    {
        command: ['perplexity'],
        operate: async ({ supreme, m, reply, args, text }) => {
            await perplexityAICommand(supreme, m.chat, text, m);
        }
    },
    {
        command: ['bard'],
        operate: async ({ supreme, m, reply, args, text }) => {
            await bardAICommand(supreme, m.chat, text, m);
        }
    },
    {
        command: ['gpt4nano', 'gpt41nano'],
        operate: async ({ supreme, m, reply, args, text }) => {
            await gpt4NanoAICommand(supreme, m.chat, text, m);
        }
    },
    {
        command: ['kelvinai'],
        operate: async ({ supreme, m, reply, args, text }) => {
            await kelvinAICommand(supreme, m.chat, text, m);
        }
    },
    {
        command: ['claude'],
        operate: async ({ supreme, m, reply, args, text }) => {
            await claudeAICommand(supreme, m.chat, text, m);
        }
    }
    
];