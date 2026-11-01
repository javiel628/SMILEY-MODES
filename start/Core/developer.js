/* m
  -! Credits By Kevintech 
  https://wa.me/256742932677
*/

// setting/config.js
const fs = require('fs');

global.owner = ["Ｍｒ Ｓｍｉｌｅ"];  
global.status = false; // true = public, false = private
global.versions = "v1.2.1";
global.botname = "ＭＡＹＡ - ＸＭＤ"; 

// ========= Other Global Settings ========= //
global.SESSION_ID = process.env.SESSION_ID || '';
global.postgresqls = process.env.DATABASE_URL || "";

// ========= Setting WM ========= //
global.packname = 'ＭＡＹＡ - ＸＭＤ';
global.author = 'Ｓｍｉｌｅ 🤖';
global.wm = '©ＭＡＹＡ - ＸＭＤ is awesome 🔥';

// === For only developer ============
global.api = "https://xploaderapi-f5e63b.platform.cypherx.space";
global.wwe = "https://www.wwe.com/api/news";
global.wwe1 = "https://www.thesportsdb.com/api/v1/json/3/searchfilename.php?e=wwe";
global.wwe2 = "https://www.thesportsdb.com/api/v1/json/3/searchevents.php?e=wrestling";
global.falcon = "https://flowfalcon.dpdns.org";
global.siputzx = "https://api.siputzx.my.id"; 
global.updateZipUrl = "https://github.com/smiletech12/Maya-xmd/archive/refs/heads/main.zip";

global.gcount = {
  prem: 500,
  user: 15
};

global.limitCount = 10;

global.mess = {
  group: "This is not group!",
  notadmin: "This command is only preserved for group admins!",
  notgroup: "This command can only be used in groups!",
  owner: "This command is only preserved for bot owner and sudo!",
  error: "An error occurred while processing the command!",
  done: "Mission complete ✅",
  notext: "Please provide the necessary text",
  premium: "*First become a premium user*",
  botadmin: "Please bot needs admin privileges to use this command!",
  botnotadmin: "Please first make bot admin to use this command!",
  limited: "*Limit reached*",
  helpersList: [
    { name: "MR SMILE", number: "+254107065646", country: "Kenya", flag: "🇰🇪" },
    { name: "XENO TECH", number: "+254734376878", country: "Kenya", flag: "🇰🇪" },
    { name: " 𝐒𝚳𝚰𝐋𝚵 𝚳𝚯𝐃𝐙", number: "+254797856232", country: "Kenya", flag: "🇰🇪" },
  ],
  siputzx: "https://api.siputzx.my.id" 
};


let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  delete require.cache[file];
  require(file);
});
