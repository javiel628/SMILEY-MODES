const fs = require('fs');
const { exec } = require('child_process');
const { tmpdir } = require('os');
const path = require('path');
const { toAudio, toPTT } = require('../start/lib/converter');
function getRandom(ext) {
    return `${Math.floor(Math.random() * 10000)}${ext}`;
}

module.exports = [
    // Bass boost
    {
        command: ['bass'],
        operate: async ({ supreme, m, reply, prefix, command }) => {
            try {
                const quoted = m.quoted ? m.quoted : null;
                const mime = quoted?.mimetype || "";

                if (!quoted || !/audio/.test(mime)) {
                    return reply(`Reply to an *audio file* with *${prefix + command}* to modify it.`);
                }

                const mediaPath = await supreme.downloadAndSaveMediaMessage(quoted);
                const outputPath = path.join(tmpdir(), getRandom('.mp3'));

                exec(`ffmpeg -i ${mediaPath} -af equalizer=f=54:width_type=o:width=2:g=20 ${outputPath}`, (error) => {
                    fs.unlinkSync(mediaPath);
                    if (error) return reply(error.toString());

                    const audioBuffer = fs.readFileSync(outputPath);
                    supreme.sendMessage(m.chat, { audio: audioBuffer, mimetype: 'audio/mpeg' }, { quoted: m });
                    fs.unlinkSync(outputPath);
                });
            } catch (err) {
                reply(err.toString());
            }
        }
    },

    // Blown effect
    {
        command: ['blown'],
        operate: async ({ supreme, m, reply, prefix, command }) => {
            try {
                const quoted = m.quoted ? m.quoted : null;
                const mime = quoted?.mimetype || "";
                if (!quoted || !/audio/.test(mime)) {
                    return reply(`Reply to an *audio file* with *${prefix + command}* to modify it.`);
                }

                const mediaPath = await supreme.downloadAndSaveMediaMessage(quoted);
                const outputPath = path.join(tmpdir(), getRandom('.mp3'));

                exec(`ffmpeg -i ${mediaPath} -af atempo=4/4,asetrate=44500*2/3 ${outputPath}`, (error) => {
                    fs.unlinkSync(mediaPath);
                    if (error) return reply(error.toString());

                    const audioBuffer = fs.readFileSync(outputPath);
                    supreme.sendMessage(m.chat, { audio: audioBuffer, mimetype: 'audio/mpeg' }, { quoted: m });
                    fs.unlinkSync(outputPath);
                });
            } catch (err) {
                reply(err.toString());
            }
        }
    },

    // Earrape effect
    {
        command: ['earrape'],
        operate: async ({ supreme, m, reply, prefix, command }) => {
            try {
                const quoted = m.quoted ? m.quoted : null;
                const mime = quoted?.mimetype || "";

                if (!quoted || !/audio/.test(mime)) {
                    return reply(`Reply to an *audio file* with *${prefix + command}* to modify it.`);
                }

                const mediaPath = await supreme.downloadAndSaveMediaMessage(quoted);
                const outputPath = path.join(tmpdir(), getRandom('.mp3'));

                exec(`ffmpeg -i ${mediaPath} -af volume=12 ${outputPath}`, (error) => {
                    fs.unlinkSync(mediaPath);
                    if (error) return reply(error.toString());

                    const audioBuffer = fs.readFileSync(outputPath);
                    supreme.sendMessage(m.chat, { audio: audioBuffer, mimetype: 'audio/mpeg' }, { quoted: m });
                    fs.unlinkSync(outputPath);
                });
            } catch (err) {
                reply(err.toString());
            }
        }
    },

    // Volume adjustment
    {
        command: ['volaudio', 'volume'],
        operate: async ({ supreme, m, reply, prefix, command }) => {
            try {
                const quoted = m.quoted ? m.quoted : null;
                const mime = quoted?.mimetype || "";

                if (!quoted || !/audio/.test(mime)) {
                    return reply(`Reply to an *audio file* with *${prefix + command}* to adjust volume.`);
                }

                const mediaPath = await supreme.downloadAndSaveMediaMessage(quoted);
                const outputPath = path.join(tmpdir(), getRandom('.mp3'));

                exec(`ffmpeg -i ${mediaPath} -filter:a "volume=2.0" ${outputPath}`, (error) => {
                    fs.unlinkSync(mediaPath);
                    if (error) return reply(error.toString());

                    const audioBuffer = fs.readFileSync(outputPath);
                    supreme.sendMessage(m.chat, { audio: audioBuffer, mimetype: 'audio/mpeg' }, { quoted: m });
                    fs.unlinkSync(outputPath);
                });
            } catch (err) {
                reply(err.toString());
            }
        }
    },

    // Treble boost
    {
        command: ['treble'],
        operate: async ({ supreme, m, reply, prefix, command }) => {
            try {
                const quoted = m.quoted ? m.quoted : null;
                const mime = quoted?.mimetype || "";

                if (!quoted || !/audio/.test(mime)) {
                    return reply(`Reply to an *audio file* with *${prefix + command}* to modify it.`);
                }

                const mediaPath = await supreme.downloadAndSaveMediaMessage(quoted);
                const outputPath = path.join(tmpdir(), getRandom('.mp3'));

                exec(`ffmpeg -i ${mediaPath} -af equalizer=f=10000:width_type=o:width=2:g=15 ${outputPath}`, (error) => {
                    fs.unlinkSync(mediaPath);
                    if (error) return reply(error.toString());

                    const audioBuffer = fs.readFileSync(outputPath);
                    supreme.sendMessage(m.chat, { audio: audioBuffer, mimetype: 'audio/mpeg' }, { quoted: m });
                    fs.unlinkSync(outputPath);
                });
            } catch (err) {
                reply(err.toString());
            }
        }
    },

    // Fast audio
    {
        command: ['fast'],
        operate: async ({ supreme, m, reply, prefix, command }) => {
            try {
                const quoted = m.quoted ? m.quoted : null;
                const mime = quoted?.mimetype || "";

                if (!quoted || !/audio/.test(mime)) {
                    return reply(`Reply to an *audio file* with *${prefix + command}* to modify it.`);
                }

                const mediaPath = await supreme.downloadAndSaveMediaMessage(quoted);
                const outputPath = path.join(tmpdir(), getRandom('.mp3'));

                exec(`ffmpeg -i ${mediaPath} -filter:a "atempo=1.5" ${outputPath}`, (error) => {
                    fs.unlinkSync(mediaPath);
                    if (error) return reply(error.toString());

                    const audioBuffer = fs.readFileSync(outputPath);
                    supreme.sendMessage(m.chat, { audio: audioBuffer, mimetype: 'audio/mpeg' }, { quoted: m });
                    fs.unlinkSync(outputPath);
                });
            } catch (err) {
                reply(err.toString());
            }
        }
    },

    // Slow audio
    {
        command: ['slow'],
        operate: async ({ supreme, m, reply, prefix, command }) => {
            try {
                const quoted = m.quoted ? m.quoted : null;
                const mime = quoted?.mimetype || "";

                if (!quoted || !/audio/.test(mime)) {
                    return reply(`Reply to an *audio file* with *${prefix + command}* to modify it.`);
                }

                const mediaPath = await supreme.downloadAndSaveMediaMessage(quoted);
                const outputPath = path.join(tmpdir(), getRandom('.mp3'));

                exec(`ffmpeg -i ${mediaPath} -filter:a "atempo=0.8" ${outputPath}`, (error) => {
                    fs.unlinkSync(mediaPath);
                    if (error) return reply(error.toString());

                    const audioBuffer = fs.readFileSync(outputPath);
                    supreme.sendMessage(m.chat, { audio: audioBuffer, mimetype: 'audio/mpeg' }, { quoted: m });
                    fs.unlinkSync(outputPath);
                });
            } catch (err) {
                reply(err.toString());
            }
        }
    },

    // Reverse audio
    {
        command: ['reverse'],
        operate: async ({ supreme, m, reply, prefix, command }) => {
            try {
                const quoted = m.quoted ? m.quoted : null;
                const mime = quoted?.mimetype || "";

                if (!quoted || !/audio/.test(mime)) {
                    return reply(`Reply to an *audio file* with *${prefix + command}* to modify it.`);
                }

                const mediaPath = await supreme.downloadAndSaveMediaMessage(quoted);
                const outputPath = path.join(tmpdir(), getRandom('.mp3'));

                exec(`ffmpeg -i ${mediaPath} -filter_complex "areverse" ${outputPath}`, (error) => {
                    fs.unlinkSync(mediaPath);
                    if (error) return reply(error.toString());

                    const audioBuffer = fs.readFileSync(outputPath);
                    supreme.sendMessage(m.chat, { audio: audioBuffer, mimetype: 'audio/mpeg' }, { quoted: m });
                    fs.unlinkSync(outputPath);
                });
            } catch (err) {
                reply(err.toString());
            }
        }
    },

    // Echo effect
    {
        command: ['echo'],
        operate: async ({ supreme, m, reply, prefix, command }) => {
            try {
                const quoted = m.quoted ? m.quoted : null;
                const mime = quoted?.mimetype || "";

                if (!quoted || !/audio/.test(mime)) {
                    return reply(`Reply to an *audio file* with *${prefix + command}* to modify it.`);
                }

                const mediaPath = await supreme.downloadAndSaveMediaMessage(quoted);
                const outputPath = path.join(tmpdir(), getRandom('.mp3'));

                exec(`ffmpeg -i ${mediaPath} -filter:a "aecho=0.8:0.9:1000:0.3" ${outputPath}`, (error) => {
                    fs.unlinkSync(mediaPath);
                    if (error) return reply(error.toString());

                    const audioBuffer = fs.readFileSync(outputPath);
                    supreme.sendMessage(m.chat, { audio: audioBuffer, mimetype: 'audio/mpeg' }, { quoted: m });
                    fs.unlinkSync(outputPath);
                });
            } catch (err) {
                reply(err.toString());
            }
        }
    },

    // Robot effect
    {
        command: ['robot'],
        operate: async ({ supreme, m, reply, prefix, command }) => {
            try {
                const quoted = m.quoted ? m.quoted : null;
                const mime = quoted?.mimetype || "";

                if (!quoted || !/audio/.test(mime)) {
                    return reply(`Reply to an *audio file* with *${prefix + command}* to modify it.`);
                }

                const mediaPath = await supreme.downloadAndSaveMediaMessage(quoted);
                const outputPath = path.join(tmpdir(), getRandom('.mp3'));

                exec(`ffmpeg -i ${mediaPath} -filter_complex "afftfilt=real='hypot(re,im)*sin(0)':imag='hypot(re,im)*cos(0)':win_size=512:overlap=0.75" ${outputPath}`, (error) => {
                    fs.unlinkSync(mediaPath);
                    if (error) return reply(error.toString());

                    const audioBuffer = fs.readFileSync(outputPath);
                    supreme.sendMessage(m.chat, { audio: audioBuffer, mimetype: 'audio/mpeg' }, { quoted: m });
                    fs.unlinkSync(outputPath);
                });
            } catch (err) {
                reply(err.toString());
            }
        }
    },

    // Deep voice
    {
        command: ['deep'],
        operate: async ({ supreme, m, reply, prefix, command }) => {
            try {
                const quoted = m.quoted ? m.quoted : null;
                const mime = quoted?.mimetype || "";

                if (!quoted || !/audio/.test(mime)) {
                    return reply(`Reply to an *audio file* with *${prefix + command}* to modify it.`);
                }

                const mediaPath = await supreme.downloadAndSaveMediaMessage(quoted);
                const outputPath = path.join(tmpdir(), getRandom('.mp3'));

                exec(`ffmpeg -i ${mediaPath} -filter:a "asetrate=44100*0.7,aresample=44100" ${outputPath}`, (error) => {
                    fs.unlinkSync(mediaPath);
                    if (error) return reply(error.toString());

                    const audioBuffer = fs.readFileSync(outputPath);
                    supreme.sendMessage(m.chat, { audio: audioBuffer, mimetype: 'audio/mpeg' }, { quoted: m });
                    fs.unlinkSync(outputPath);
                });
            } catch (err) {
                reply(err.toString());
            }
        }
    },

    // Chipmunk effect
    {
        command: ['chipmunk'],
        operate: async ({ supreme, m, reply, prefix, command }) => {
            try {
                const quoted = m.quoted ? m.quoted : null;
                const mime = quoted?.mimetype || "";

                if (!quoted || !/audio/.test(mime)) {
                    return reply(`Reply to an *audio file* with *${prefix + command}* to modify it.`);
                }

                const mediaPath = await supreme.downloadAndSaveMediaMessage(quoted);
                const outputPath = path.join(tmpdir(), getRandom('.mp3'));

                exec(`ffmpeg -i ${mediaPath} -filter:a "asetrate=44100*1.5,aresample=44100" ${outputPath}`, (error) => {
                    fs.unlinkSync(mediaPath);
                    if (error) return reply(error.toString());

                    const audioBuffer = fs.readFileSync(outputPath);
                    supreme.sendMessage(m.chat, { audio: audioBuffer, mimetype: 'audio/mpeg' }, { quoted: m });
                    fs.unlinkSync(outputPath);
                });
            } catch (err) {
                reply(err.toString());
            }
        }
    },

    // Nightcore effect
    {
        command: ['nightcore'],
        operate: async ({ supreme, m, reply, prefix, command }) => {
            try {
                const quoted = m.quoted ? m.quoted : null;
                const mime = quoted?.mimetype || "";

                if (!quoted || !/audio/.test(mime)) {
                    return reply(`Reply to an *audio file* with *${prefix + command}* to modify it.`);
                }

                const mediaPath = await supreme.downloadAndSaveMediaMessage(quoted);
                const outputPath = path.join(tmpdir(), getRandom('.mp3'));

                exec(`ffmpeg -i ${mediaPath} -filter:a "atempo=1.06,asetrate=44100*1.25" ${outputPath}`, (error) => {
                    fs.unlinkSync(mediaPath);
                    if (error) return reply(error.toString());

                    const audioBuffer = fs.readFileSync(outputPath);
                    supreme.sendMessage(m.chat, { audio: audioBuffer, mimetype: 'audio/mpeg' }, { quoted: m });
                    fs.unlinkSync(outputPath);
                });
            } catch (err) {
                reply(err.toString());
            }
        }
    },

    // Instrumental extraction
    {
        command: ['instrumental'],
        operate: async ({ supreme, m, reply, prefix, command }) => {
            try {
                const quoted = m.quoted ? m.quoted : null;
                const mime = quoted?.mimetype || "";

                if (!quoted || !/audio/.test(mime)) {
                    return reply(`Reply to an *audio file* with *${prefix + command}* to extract instrumental.`);
                }

                const mediaPath = await supreme.downloadAndSaveMediaMessage(quoted);
                const outputPath = path.join(tmpdir(), getRandom('.mp3'));

                exec(`ffmpeg -i ${mediaPath} -af "pan=stereo|c0=c0|c1=c1,aresample=async=1:first_pts=0" ${outputPath}`, (error) => {
                    fs.unlinkSync(mediaPath);
                    if (error) return reply(error.toString());

                    const audioBuffer = fs.readFileSync(outputPath);
                    supreme.sendMessage(m.chat, { audio: audioBuffer, mimetype: 'audio/mpeg' }, { quoted: m });
                    fs.unlinkSync(outputPath);
                });
            } catch (err) {
                reply(err.toString());
            }
        }
    },

    // Vocal removal
    {
        command: ['vocalremove'],
        operate: async ({ supreme, m, reply, prefix, command }) => {
            try {
                const quoted = m.quoted ? m.quoted : null;
                const mime = quoted?.mimetype || "";

                if (!quoted || !/audio/.test(mime)) {
                    return reply(`Reply to an *audio file* with *${prefix + command}* to remove vocals.`);
                }

                const mediaPath = await supreme.downloadAndSaveMediaMessage(quoted);
                const outputPath = path.join(tmpdir(), getRandom('.mp3'));

                exec(`ffmpeg -i ${mediaPath} -af "pan=stereo|c0=c0|c1=-1*c1" ${outputPath}`, (error) => {
                    fs.unlinkSync(mediaPath);
                    if (error) return reply(error.toString());

                    const audioBuffer = fs.readFileSync(outputPath);
                    supreme.sendMessage(m.chat, { audio: audioBuffer, mimetype: 'audio/mpeg' }, { quoted: m });
                    fs.unlinkSync(outputPath);
                });
            } catch (err) {
                reply(err.toString());
            }
        }
    },

    // Karaoke effect
    {
        command: ['karaoke'],
        operate: async ({ supreme, m, reply, prefix, command }) => {
            try {
                const quoted = m.quoted ? m.quoted : null;
                const mime = quoted?.mimetype || "";

                if (!quoted || !/audio/.test(mime)) {
                    return reply(`Reply to an *audio file* with *${prefix + command}* to create karaoke version.`);
                }

                const mediaPath = await supreme.downloadAndSaveMediaMessage(quoted);
                const outputPath = path.join(tmpdir(), getRandom('.mp3'));

                exec(`ffmpeg -i ${mediaPath} -af "stereotools=mode=ms>lr" ${outputPath}`, (error) => {
                    fs.unlinkSync(mediaPath);
                    if (error) return reply(error.toString());

                    const audioBuffer = fs.readFileSync(outputPath);
                    supreme.sendMessage(m.chat, { audio: audioBuffer, mimetype: 'audio/mpeg' }, { quoted: m });
                    fs.unlinkSync(outputPath);
                });
            } catch (err) {
                reply(err.toString());
            }
        }
    },
    {
  command: ['toptt', 'tovn'],
  react: "🗣️",
  operate: async ({ supreme, m, reply }) => {
  const quoted = m.quoted ? m.quoted : null;
  const mime = quoted?.mimetype || "";
    if (!quoted) return reply('*Reply to an audio file to convert it to voice note!*');
    if (!/audio/.test(mime)) return reply('*Only audio files can be converted to voice notes!*');

    try {
      let buffer = await quoted.download();
      let converted = await toPTT(buffer, 'mp3');

      await supreme.sendMessage(m.chat, { audio: converted.data, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: m });
      await converted.delete();
    } catch (e) {
      console.error(e);
      reply(global.mess.error);
    }
  }
}
];