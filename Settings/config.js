const fs = require('fs')

const config = {
    owner: "-",
    botNumber: "-",
    setPair: "DARKKNIF",
        thumbUrl: "https://files.catbox.moe/ostnlj.jpg",
    session: "sessions",
    status: {
        public: true,
        terminal: true,
        reactsw: true,
    },
    message: {
        premium: " `anda tidak terdaftar di dalam premium` ",
        owner: " `anda tidak terdaftar di dalam owner` ",
        group: " `di dalam grup bang` ",
        admin: " `khusus admin bang` ",
        done: " `done abang awak` ",
        private: "this is specifically for private chat"
    },
    settings: {
        title: "DARK KNIFE",
        packname: 'DARK KNIFE',
        description: "Dark Knife create by Fiyo",
        author: 'https://www.fiyo.tech',
        footer: "DARK KNIFE VERSION 12"
    },
    newsletter: {
        name: "DARK KNIFE",
        id: "120363403137796385@newsletter"
    },
    socialMedia: {
        YouTube: "https://youtube.com/-id",
        GitHub: "https://github.com/-id",
        Telegram: "https://t.me/forturnix17",
        ChannelWA: "https://whatsapp.com/channel/0029Vb73do64CrfeJ18mIJ45"
    }
}

module.exports = config;

let file = require.resolve(__filename)
require('fs').watchFile(file, () => {
  require('fs').unwatchFile(file)
  console.log('\x1b[0;32m'+__filename+' \x1b[1;32mupdated!\x1b[0m')
  delete require.cache[file]
  require(file)
})
