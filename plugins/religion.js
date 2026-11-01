const fetch = require('node-fetch');

module.exports = [
    {
        command: ['bible'],
        operate: async ({ reply, m, text, prefix }) => {
            const BASE_URL = "https://bible-api.com";

            try {
                let chapterInput = text.split(" ").join("").trim();
                if (!chapterInput) {
                    throw new Error(`*Please specify the chapter number or name. Example: ${prefix}bible John 3:16*`);
                }
                chapterInput = encodeURIComponent(chapterInput);
                let chapterRes = await fetch(`${BASE_URL}/${chapterInput}`);
                if (!chapterRes.ok) {
                    throw new Error(`*Please specify the chapter number or name. Example: ${prefix}bible John 3:16*`);
                }
                
                let chapterData = await chapterRes.json();
                let bibleChapter = `
*The Holy Bible*\n
*Chapter ${chapterData.reference}*\n
Type: ${chapterData.translation_name}\n
Number of verses: ${chapterData.verses.length}\n
*Chapter Content:*\n
${chapterData.text}\n`;
                
                reply(bibleChapter);
            } catch (error) {
                reply(`Error: ${error.message}`);
            }
        }
    },
    {
        command: ['biblelist'],
        operate: async ({ reply, m, supreme, getSetting }) => {
            try {
                const bibleList = `
📜 *Old Testament*:
1. Genesis
2. Exodus
3. Leviticus
4. Numbers
5. Deuteronomy
6. Joshua
7. Judges
8. Ruth
9. 1 Samuel
10. 2 Samuel
11. 1 Kings
12. 2 Kings
13. 1 Chronicles
14. 2 Chronicles
15. Ezra
16. Nehemiah
17. Esther
18. Job
19. Psalms
20. Proverbs
21. Ecclesiastes
22. Song of Solomon
23. Isaiah
24. Jeremiah
25. Lamentations
26. Ezekiel
27. Daniel
28. Hosea
29. Joel
30. Amos
31. Obadiah
32. Jonah
33. Micah
34. Nahum
35. Habakkuk
36. Zephaniah
37. Haggai
38. Zechariah
39. Malachi

📖 *New Testament*:
1. Matthew
2. Mark
3. Luke
4. John
5. Acts
6. Romans
7. 1 Corinthians
8. 2 Corinthians
9. Galatians
10. Ephesians
11. Philippians
12. Colossians
13. 1 Thessalonians
14. 2 Thessalonians
15. 1 Timothy
16. 2 Timothy
17. Titus
18. Philemon
19. Hebrews
20. James
21. 1 Peter
22. 2 Peter
23. 1 John
24. 2 John
25. 3 John
26. Jude
27. Revelation


💢 ${getSetting ? getSetting('botname', 'ＭＡＹＡ - ＸＭＤ') : 'ＭＡＹＡ - ＸＭＤ'} 💢
`;

                const imageUrl = "https://files.catbox.moe/ptpl5c.jpeg";

                if (!m.chat) {
                    return reply("❌ *An error occurred: Invalid chat.*");
                }

                await supreme.sendMessage(m.chat, {
                    image: { url: imageUrl },
                    caption: `📖 *BIBLE LIST ＭＡＹＡ - ＸＭＤ*:\n\n` +
                             `Here is the complete list of books in the Bible:\n\n` +
                             bibleList.trim()
                }, { quoted: m });
            } catch (error) {
                console.error(error);
                reply("❌ *An error occurred while fetching the Bible list. Please try again.*");
            }
        }
    },
        {
        command: ['quran'],
        operate: async ({ reply, m, supreme, text }) => {
            try {
                const surahNumber = parseInt(text.trim());
                
                if (!text || isNaN(surahNumber)) {
                    await supreme.sendMessage(m.chat, { text: "📖 Usage: .quran <surah_number>\nExample: .quran 1" });
                    return;
                }

                const url = `https://apis.davidcyriltech.my.id/quran?surah=${surahNumber}`;
                const res = await fetch(url);
                const data = await res.json();

                if (!data.success) {
                    await supreme.sendMessage(m.chat, { text: "❌ Could not fetch Surah. Please try another number." });
                    return;
                }

                const { number, name, type, ayahCount, tafsir, recitation } = data.surah;

                let replyText = `📖 *Surah ${name.english}* (${name.arabic})\n\n`;
                replyText += `Surah Number: ${number}\n📌 Type: ${type}\n📜 Ayahs: ${ayahCount}\n\n`;
                replyText += `Tafsir: ${tafsir.id}`;

                await supreme.sendMessage(m.chat, { text: replyText });

                await supreme.sendMessage(m.chat, {
                    audio: { url: recitation },
                    mimetype: "audio/mp4",
                    ptt: true
                }, { quoted: m });

            } catch (err) {
                await supreme.sendMessage(m.chat, { text: "⚠️ Error fetching Surah. Try again later." });
                console.error("Quran command error:", err.message);
            }
        }
    }
]