const db = require('../../start/Core/databaseManager'); 

async function handleAutoRead(m, supreme) {
    try {
        const botNumber = await supreme.decodeJid(supreme.user.id);
        
        // ✅ GET AUTO-READ SETTING FROM SQLITE
        const autoread = await db.get(botNumber, 'autoread', false);
        
        // Check if auto-read is enabled
        if (!autoread) {
            return;
        }

        // Don't mark bot's own messages as read
        if (m.key.fromMe) return;

        // Mark message as read - CORRECT BAILEYS METHOD
        await supreme.readMessages([m.key]);
        
    } catch (error) {
        console.error("❌ Error in auto-read:", error);
    }
}

module.exports = { handleAutoRead };