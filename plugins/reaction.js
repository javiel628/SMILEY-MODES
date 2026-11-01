const axios = require('axios');

const fetchReactionImage = async ({ supreme, m, reply, command }) => {
  try {
    const { data } = await axios.get(`https://api.waifu.pics/sfw/${command}`);
    await supreme.sendImageAsSticker(m.chat, data.url, m, {
      packname: global.packname,
      author: global.author,
    });
  } catch (error) {
      reply(global.mess.error);
  }
};

module.exports = [
    {
        command: ['kiss', 'cium', 'beso'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'kiss' });
        }
    },
    {
        command: ['cry'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'cry' });
        }
    },
    {
        command: ['blush'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'blush' });
        }
    },
    {
        command: ['dance'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'dance' });
        }
    },
    {
        command: ['kill'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'kill' });
        }
    },
    {
        command: ['hug'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'hug' });
        }
    },
    {
        command: ['kick', 'kick3'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'kick3' });
        }
    },
    {
        command: ['slap'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'slap' });
        }
    },
    {
        command: ['happy'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'happy' });
        }
    },
    {
        command: ['bully'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'bully' });
        }
    },
    {
        command: ['pat', 'headpat'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'pat' });
        }
    },
    {
        command: ['wink'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'wink' });
        }
    },
    {
        command: ['poke'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'poke' });
        }
    },
    {
        command: ['cuddle'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'cuddle' });
        }
    },
    {
        command: ['highfive', 'hi5'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'highfive' });
        }
    },
    {
        command: ['smile'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'smile' });
        }
    },
    {
        command: ['wave'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'wave' });
        }
    },
    {
        command: ['bite'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'bite' });
        }
    },
    {
        command: ['lick'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'lick' });
        }
    },
    {
        command: ['bonk'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'bonk' });
        }
    },
    {
        command: ['yeet'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'yeet' });
        }
    },
    {
        command: ['glomp'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'glomp' });
        }
    },
    {
        command: ['stab'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'stab' });
        }
    },
    {
        command: ['nom'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'nom' });
        }
    },
    {
        command: ['tickle'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'tickle' });
        }
    },
    {
        command: ['throw'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'throw' });
        }
    },
    {
        command: ['facepalm'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'facepalm' });
        }
    },
    {
        command: ['feed'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'feed' });
        }
    },
    {
        command: ['spank'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'spank' });
        }
    },
    {
        command: ['handhold', 'holdhands'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'handhold' });
        }
    },
    {
        command: ['shoot'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'shoot' });
        }
    },
    {
        command: ['punch'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'punch' });
        }
    },
    {
        command: ['stare'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'stare' });
        }
    },
    {
        command: ['comfort'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'comfort' });
        }
    },
    {
        command: ['boop', 'boopnose'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'boop' });
        }
    },
    {
        command: ['sleep'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'sleep' });
        }
    },
    {
        command: ['shrug'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'shrug' });
        }
    },
    {
        command: ['sip'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'sip' });
        }
    },
    {
        command: ['clap'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'clap' });
        }
    },
    {
        command: ['nervous'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'nervous' });
        }
    },
    {
        command: ['scream'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'scream' });
        }
    },
    {
        command: ['pout'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'pout' });
        }
    },
    {
        command: ['bored'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'bored' });
        }
    },
    {
        command: ['laugh'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'laugh' });
        }
    },
    {
        command: ['shy'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'shy' });
        }
    },
    {
        command: ['confused'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'confused' });
        }
    },
    {
        command: ['angry'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'angry' });
        }
    },
    {
        command: ['excited'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'excited' });
        }
    },
    {
        command: ['fear'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'fear' });
        }
    },
    {
        command: ['surprised'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'surprised' });
        }
    },
    {
        command: ['thinking'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'thinking' });
        }
    },
    {
        command: ['embarrassed'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'embarrassed' });
        }
    },
    {
        command: ['tired'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'tired' });
        }
    },
    {
        command: ['sad'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'sad' });
        }
    },
    {
        command: ['love'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'love' });
        }
    },
    {
        command: ['peace'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'peace' });
        }
    },
    {
        command: ['victory', 'victorysign'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'victory' });
        }
    },
    {
        command: ['point'],
        operate: async ({ supreme, command, m, reply }) => {
            await fetchReactionImage({ supreme, m, reply, command: 'point' });
        }
    }
]