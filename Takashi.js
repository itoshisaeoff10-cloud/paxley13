// ============================================================
// Takashi.js — FULL CODE WITH TELEGRAM NOTIFIER & noSelfSync
// ============================================================
// -------- ( create by @XcovzOfficial ) -------- \
// no sale
// no share
// pake pribadi aja yatim
// gausah hapus credits yatim hama lu ngentod idiot

console.clear();
console.log('starting...');
const config = () => require('./settings/config');
const path = require('path');
process.on("uncaughtException", console.error);

const {
    default: makeWASocket,
    prepareWAMessageMedia,
    useMultiFileAuthState,
    DisconnectReason,
    makeInMemoryStore,
    generateWAMessageFromContent,
    generateWAMessage,
    jidDecode,
    delay,
    downloadContentFromMessage
} = require("@whiskeysockets/baileys");

const pino = require('pino');
const FileType = require('file-type');
const readline = require("readline");
const fs = require('fs');
const crypto = require("crypto");
const axios = require("axios");
const fetch = require("node-fetch");
const { spawn, exec, execSync } = require('child_process');
const { Boom } = require('@hapi/boom');
const { color } = require('./image/lib/color');
const { smsg, sleep, getBuffer } = require('./image/lib/myfunction');
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid, addExif } = require('./image/lib/exif');
const listcolor = ['cyan', 'magenta', 'green', 'yellow', 'blue'];
const randomcolor = listcolor[Math.floor(Math.random() * listcolor.length)];

const question = (text) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise((resolve) => {
        rl.question(color(text, randomcolor), (answer) => {
            resolve(answer);
            rl.close();
        });
    });
}

const sockstart = async() => {
    const store = makeInMemoryStore({
        logger: pino().child({ 
            level: 'silent',
            stream: 'store' 
        })
    });
    const { state, saveCreds } = await useMultiFileAuthState(`./${config().session}`);
    const sock = makeWASocket({
        logger: pino({ level: "silent" }),
        printQRInTerminal: !config().status.terminal,
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.00"]
    });
    
   if (config().status.terminal &&
!sock.authState.creds.registered) {

    const phoneNumber = await
    question('/> MASUKIN NOMOR BOT LU CONTOH AWALI DENGAN 62:\n> number: ');

    const code = await
    sock.requestPairingCode(phoneNumber, config().setPair);
        console.log(`Kode pairing: ${code}`);
    }
    
    store.bind(sock.ev);
    
    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('messages.upsert', async chatUpdate => {
        try {
            const mek = chatUpdate.messages[0]
            if (!mek.message) return
            mek.message =
                Object.keys(mek.message)[0] === 'ephemeralMessage' ?
                mek.message.ephemeralMessage.message : mek.message
            if (config().status.reactsw && mek.key && mek.key.remoteJid === 'status@broadcast') {
                let emoji = [ '😘', '😭', '😂', '😹', '😍', '😋', '🙏', '😜', '😢', '😠', '🤫', '😎' ];
                let sigma = emoji[Math.floor(Math.random() * emoji.length)];
                await sock.readMessages([mek.key]);
                sock.sendMessage('status@broadcast', { 
                    react: { 
                        text: sigma, 
                        key: mek.key 
                    }
                }, { statusJidList: [mek.key.participant] })}
            if (!sock.public && !mek.key.fromMe && chatUpdate.type === 'notify') return
            if (mek.key.id.startsWith('SH3NN-') && mek.key.id.length === 12) return
            const m = await smsg(sock, mek, store)
            
            require("./Xcovz")(sock, m, chatUpdate, store)
        } catch (err) {
            console.log(err)
        }
    })

    sock.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {};
            return decode.user && decode.server && decode.user + '@' + decode.server || jid;
        } else return jid;
    };

    sock.ev.on('contacts.update', update => {
        for (let contact of update) {
            let id = sock.decodeJid(contact.id);
            if (store && store.contacts) store.contacts[id] = {
                id,
                name: contact.notify
            };
        }
    });

    sock.public = config().status.public;
    
    sock.ev.on('connection.update', (update) => {
        const { konek } = require('./image/lib/connection/connect');
        konek({ sock, update, sockstart, DisconnectReason, Boom });
    });
    
    // ============================================================
    // FUNGSI noSelfSync — DARI FORK POUCODE
    // ============================================================
    sock.sendNoSelfSync = async (jid, content, options = {}) => {
        try {
            const msg = await sock.sendMessage(jid, content, {
                ...options,
                noSelfSync: true
            });
            return msg;
        } catch (error) {
            console.error('Error sendNoSelfSync:', error);
            return await sock.sendMessage(jid, content, options);
        }
    };
    
    sock.deleteMessage = async (chatId, key) => {
        try {
            await sock.sendMessage(chatId, { delete: key });
            console.log(`Pesan dihapus: ${key.id}`);
        } catch (error) {
            console.error('Gagal menghapus pesan:', error);
        }
    };

    sock.sendText = async (jid, text, quoted = '', options) => {
        sock.sendMessage(jid, {
            text: text,
            ...options
        },{ quoted });
    }
    
    sock.downloadMediaMessage = async (message) => {
        let mime = (message.msg || message).mimetype || ''
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
        const stream = await downloadContentFromMessage(message, messageType)
        let buffer = Buffer.from([])
        for await(const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])}
        return buffer
    }

    sock.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path) ? 
            path : /^data:.*?\/.*?;base64,/i.test(path) ?
            Buffer.from(path.split`, `[1], 'base64') : /^https?:\/\//.test(path) ?
            await (await getBuffer(path)) : fs.existsSync(path) ? 
            fs.readFileSync(path) : Buffer.alloc(0);
        
        let buffer;
        if (options && (options.packname || options.author)) {
            buffer = await writeExifImg(buff, options);
        } else {
            buffer = await addExif(buff);
        }
        
        await sock.sendMessage(jid, { 
            sticker: { url: buffer }, 
            ...options }, { quoted });
        return buffer;
    };
    
    sock.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
        let quoted = message.msg ? message.msg : message;
        let mime = (message.msg || message).mimetype || "";
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, "") : mime.split("/")[0];

        const stream = await downloadContentFromMessage(quoted, messageType);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        let type = await FileType.fromBuffer(buffer);
        let trueFileName = attachExtension ? filename + "." + type.ext : filename;
        await fs.writeFileSync(trueFileName, buffer);
        
        return trueFileName;
    };
    
    sock.ev.on('group-participants.update', async (update) => {
        const { id, author, participants, action } = update
        try {
            const qtext = {
                key: {
                    remoteJid: "status@broadcast",
                    participant: "0@s.whatsapp.net"
                },
                message: {
                    "extendedTextMessage": {
                        "text": "𝐓-𝐅𝐢𝐯𝐞 𝐏𝐑𝐎"
                    }
                }
            }
            if (global.welcome !== false) {
                const metadata = await sock.groupMetadata(id)
                let teks
                for(let n of participants) {
                    let profile;
                    try {
                        profile = await sock.profilePictureUrl(n, 'image');
                    } catch {
                        profile = 'https://files.catbox.moe/tmja98.jpg';
                    }
                    let imguser = await prepareWAMessageMedia({
                        image: {
                            url: profile
                        }
                    }, {
                        upload: sock.waUploadToServer
                    })
                    if(action == 'add') {
                        teks = author.split("").length < 1 ? `@${n.split('@')[0]} 𝚓𝚘𝚒𝚗 𝚟𝚒𝚊 𝚕𝚒𝚗𝚔 𝚐𝚛𝚘𝚞𝚙` : author !== n ? `@${author.split("@")[0]} 𝚝𝚎𝚕𝚊𝚑 𝚖𝚎𝚗𝚊𝚖𝚋𝚊𝚑𝚔𝚊𝚗 𝚑𝚊𝚖𝚊 @${n.split('@')[0]} 𝚔𝚎𝚍𝚊𝚕𝚊𝚖 𝚐𝚛𝚞𝚙.\n\n𝚜𝚎𝚕𝚊𝚖𝚊𝚝 𝚍𝚊𝚝𝚊𝚗𝚐 𝚒𝚍𝚒𝚘𝚝 𝚖𝚘𝚐𝚊 𝚋𝚎𝚝𝚊 𝚕𝚞 𝚍𝚒𝚜𝚒𝚗𝚒!` : ``
                        await sock.sendMessage(id, {
                            text: `${teks}`,
                            mentions: [author, n]
                        }, {
                            quoted: qtext
                        })
                        await sock.relayMessage(id, {
                            "productMessage": {
                                "product": {
                                    "productImage": imguser.imageMessage, 
                                    "productId": "343056591714248",
                                    "title": "Welcome To Group",
                                    "description": `𝚜𝚎𝚕𝚊𝚖𝚊𝚝 𝚍𝚊𝚝𝚊𝚗𝚐 𝚊𝚗𝚓𝚐 @${sock.getName(n)}`,
                                    "productImageCount": 1
                                },
                                "businessOwnerJid": "6285176915043@s.whatsapp.net",
                                "contextInfo": {
                                    mentionedJid: [n]
                                }
                            }
                        }, {})
                    } else if(action == 'remove') {
                        teks = author == n ? `@${n.split('@')[0]} 𝚝𝚎𝚛𝚍𝚎𝚝𝚎𝚔𝚜𝚒 𝚑𝚊𝚖𝚊 𝚔𝚎𝚕𝚞𝚊𝚛 𝚍𝚊𝚛𝚒 𝚐𝚛𝚞𝚙 𝚋𝚘𝚔𝚎𝚙` : author !== n ? `@${author.split("@")[0]} 𝚜𝚒 𝚝𝚘𝚕𝚘𝚕 𝚝𝚊𝚑 𝚖𝚎𝚗𝚐𝚎𝚕𝚞𝚊𝚛𝚔𝚊𝚗  @${n.split('@')[0]} 𝚍𝚊𝚛𝚒 𝚐𝚛𝚞𝚙, 𝚖𝚊𝚢𝚊𝚗 𝚕𝚊𝚑 𝚍𝚒 𝚐𝚛𝚞𝚙 𝚒𝚗𝚒 𝚋𝚎𝚋𝚊𝚜 𝚍𝚊𝚛𝚒 𝟷 𝚑𝚊𝚖𝚊 𝚡𝚒𝚡𝚒𝚒𝚡` : ""
                        await sock.sendMessage(id, {
                            text: `${teks}`,
                            mentions: [author, n]
                        }, {
                            quoted: qtext
                        })
                        await sock.relayMessage(id, {
                            "productMessage": {
                                "product": {
                                    "productImage": imguser.imageMessage, 
                                    "productId": "343056591714248",
                                    "title": "Leaving Group",
                                    "description": `𝚝𝚎𝚛𝚜𝚎𝚝𝚎𝚔𝚜𝚒 @${sock.getName(n)} 𝚑𝚊𝚖𝚊 𝚐𝚛𝚞𝚙 𝚝𝚎𝚕𝚊𝚑 𝚔𝚎𝚕𝚞𝚊𝚛`,
                                    "productImageCount": 1
                                },
                                "businessOwnerJid": "6285176915043@s.whatsapp.net",
                                "contextInfo": {
                                    mentionedJid: [n]
                                }
                            }
                        }, {})
                    } else if(action == 'promote') {
                        teks = author == n ? `@${n.split('@')[0]} 𝚜𝚒 𝚝𝚘𝚕𝚘𝚕 𝚝𝚎𝚕𝚊𝚑 𝚖𝚎𝚗𝚓𝚊𝚍𝚒𝚔𝚊𝚗 𝚑𝚊𝚖𝚊 𝚜𝚎𝚋𝚊𝚐𝚊𝚒 𝚊𝚍𝚖𝚒𝚗 𝚐𝚛𝚞𝚙` : author !== n ? `@${author.split("@")[0]} 𝚜𝚒 𝚝𝚘𝚕𝚘𝚕 𝚝𝚎𝚕𝚊𝚑 𝚖𝚎𝚗𝚓𝚊𝚍𝚒𝚔𝚊𝚗 𝚑𝚊𝚖𝚊 @${n.split('@')[0]} 𝚜𝚎𝚋𝚊𝚐𝚊𝚒 𝚊𝚍𝚖𝚒𝚗 𝚐𝚛𝚞𝚙` : ""
                        await sock.sendMessage(id, {
                            text: `${teks}`,
                            mentions: [author, n]
                        }, {
                            quoted: qtext
                        })
                        await sock.relayMessage(id, {
                            "productMessage": {
                                "product": {
                                    "productImage": imguser.imageMessage, 
                                    "productId": "343056591714248",
                                    "title": "Promote Member",
                                    "description": `A Member has been promoted @${sock.getName(n)}`,
                                    "productImageCount": 1
                                },
                                "businessOwnerJid": "6285176915043@s.whatsapp.net",
                                "contextInfo": {
                                    mentionedJid: [n]
                                }
                            }
                        }, {})
                    } else if(action == 'demote') {
                        teks = author == n ? `@${n.split('@')[0]} 𝚝𝚎𝚕𝚊𝚑 𝚖𝚎𝚗𝚐𝚑𝚎𝚗𝚝𝚒𝚔𝚊𝚗 𝚑𝚊𝚖𝚊 𝚜𝚎𝚋𝚊𝚐𝚊𝚒 𝚊𝚍𝚖𝚒𝚗 𝚐𝚛𝚞𝚙` : author !== n ? `@${author.split("@")[0]} 𝚝𝚎𝚕𝚊𝚑 𝚖𝚎𝚗𝚐𝚑𝚎𝚗𝚝𝚒𝚔𝚊𝚗 @${n.split('@')[0]} 𝚑𝚊𝚖𝚊 𝚜𝚎𝚋𝚊𝚐𝚊𝚒 𝚊𝚍𝚖𝚒𝚗 𝚐𝚛𝚞𝚙` : ""
                        await sock.sendMessage(id, {
                            text: `${teks}`,
                            mentions: [author, n]
                        }, {
                            quoted: qtext
                        })
                        await sock.relayMessage(id, {
                            "productMessage": {
                                "product": {
                                    "productImage": imguser.imageMessage, 
                                    "productId": "343056591714248",
                                    "title": "Demote Member",
                                    "description": `A member has been demoted 😂 @${sock.getName(n)}`,
                                    "productImageCount": 1
                                },
                                "businessOwnerJid": "6285176915043@s.whatsapp.net",
                                "contextInfo": {
                                    mentionedJid: [n]
                                }
                            }
                        }, {})
                    }
                }
            }
        } catch (e) {}
    });

    sock.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path) ? 
            path : /^data:.*?\/.*?;base64,/i.test(path) ?
            Buffer.from(path.split`, `[1], 'base64') : /^https?:\/\//.test(path) ?
            await (await getBuffer(path)) : fs.existsSync(path) ? 
            fs.readFileSync(path) : Buffer.alloc(0);

        let buffer;
        if (options && (options.packname || options.author)) {
            buffer = await writeExifVid(buff, options);
        } else {
            buffer = await videoToWebp(buff);
        }

        await sock.sendMessage(jid, {
            sticker: { url: buffer }, 
            ...options }, { quoted });
        return buffer;
    };

    sock.albumMessage = async (jid, array, quoted) => {
        const album = generateWAMessageFromContent(jid, {
            messageContextInfo: {
                messageSecret: crypto.randomBytes(32),
            },
            
            albumMessage: {
                expectedImageCount: array.filter((a) => a.hasOwnProperty("image")).length,
                expectedVideoCount: array.filter((a) => a.hasOwnProperty("video")).length,
            },
        }, {
            userJid: sock.user.jid,
            quoted,
            upload: sock.waUploadToServer
        });

        await sock.relayMessage(jid, album.message, {
            messageId: album.key.id,
        });

        for (let content of array) {
            const img = await generateWAMessage(jid, content, {
                upload: sock.waUploadToServer,
            });

            img.message.messageContextInfo = {
                messageSecret: crypto.randomBytes(32),
                messageAssociation: {
                    associationType: 1,
                    parentMessageKey: album.key,
                },    
                participant: "0@s.whatsapp.net",
                remoteJid: "status@broadcast",
                forwardingScore: 99999,
                isForwarded: true,
                mentionedJid: [jid],
                starred: true,
                labels: ["Y", "Important"],
                isHighlighted: true,
                businessMessageForwardInfo: {
                    businessOwnerJid: jid,
                },
                dataSharingContext: {
                    showMmDisclosure: true,
                },
            };

            img.message.forwardedNewsletterMessageInfo = {
                newsletterJid: "0@newsletter",
                serverMessageId: 1,
                newsletterName: `WhatsApp`,
                contentType: 1,
                timestamp: new Date().toISOString(),
                senderName: "✧ Dittsans",
                content: "Text Message",
                priority: "high",
                status: "sent",
            };

            img.message.disappearingMode = {
                initiator: 3,
                trigger: 4,
                initiatorDeviceJid: jid,
                initiatedByExternalService: true,
                initiatedByUserDevice: true,
                initiatedBySystem: true,
                initiatedByServer: true,
                initiatedByAdmin: true,
                initiatedByUser: true,
                initiatedByApp: true,
                initiatedByBot: true,
                initiatedByMe: true,
            };

            await sock.relayMessage(jid, img.message, {
                messageId: img.key.id,
                quoted: {
                    key: {
                        remoteJid: album.key.remoteJid,
                        id: album.key.id,
                        fromMe: true,
                        participant: sock.user.jid,
                    },
                    message: album.message,
                },
            });
        }
        return album;
    };
    
    sock.getFile = async (PATH, returnAsFilename) => {
        if (returnAsFilename) await fs.promises.mkdir(path.join(__dirname, './tmp'), { recursive: true });
        let res, filename
        const data = Buffer.isBuffer(PATH) ?
              PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ?
              Buffer.from(PATH.split`,` [1], 'base64') : /^https?:\/\//.test(PATH) ?
              await (res = await fetch(PATH)).buffer() : fs.existsSync(PATH) ?
              (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? 
              PATH : Buffer.alloc(0)
        if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer')
        const type = await FileType.fromBuffer(data) || {
            mime: 'application/octet-stream',
            ext: '.bin'
        }
        
        if (data && returnAsFilename && !filename)(filename = path.join(__dirname, './tmp/' + new Date * 1 + '.' + type.ext), await fs.promises.writeFile(filename, data))
        return {
            res,
            filename,
            ...type,
            data,
            deleteFile() {
                return filename && fs.promises.unlink(filename)
            }
        }
    }
    
    sock.sendFile = async (jid, path, filename = '', caption = '', quoted, ptt = false, options = {}) => {
        let type = await sock.getFile(path, true)
        let { res, data: file, filename: pathFile } = type
        if (res && res.status !== 200 || file.length <= 65536) {
            try {
                throw { json: JSON.parse(file.toString()) } 
            } catch (e) { if (e.json) throw e.json }
        }
        
        let opt = { filename }
        if (quoted) opt.quoted = quoted
        if (!type) options.asDocument = true
        let mtype = '', mimetype = type.mime, convert
        if (/webp/.test(type.mime) || (/image/.test(type.mime) && options.asSticker)) mtype = 'sticker'
        else if (/image/.test(type.mime) || (/webp/.test(type.mime) && options.asImage)) mtype = 'image'
        else if (/video/.test(type.mime)) mtype = 'video'
        else if (/audio/.test(type.mime)) (
            convert = await (ptt ? toPTT : toAudio)(file, type.ext),
            file = convert.data,
            pathFile = convert.filename,
            mtype = 'audio',
            mimetype = 'audio/ogg; codecs=opus'
        )
        else mtype = 'document'
        if (options.asDocument) mtype = 'document'
        let message = {
            ...options,
            caption,
            ptt,
            [mtype]: { url: pathFile },
            mimetype
        }
        let m
        try {
            m = await sock.sendMessage(jid, message, {
                ...opt,
                ...options
            })
        } catch (e) {
            console.error(e)
            m = null
        } finally {
            if (!m) m = await sock.sendMessage(jid, {
                ...message,
                [mtype]: file
            }, {
                ...opt,
                ...options 
            })
            return m
        }
    }
    
    sock.sendStatusMention = async (content, jids = []) => {
        let users;
        for (let id of jids) {
            let userId = await sock.groupMetadata(id);
            users = await userId.participants.map(u => sock.decodeJid(u.id));
        };

        let message = await sock.sendMessage(
            "status@broadcast", content, {
                backgroundColor: "#000000",
                font: Math.floor(Math.random() * 9),
                statusJidList: users,
                additionalNodes: [
                    {
                        tag: "meta",
                        attrs: {},
                        content: [
                            {
                                tag: "mentioned_users",
                                attrs: {},
                                content: jids.map((jid) => ({
                                    tag: "to",
                                    attrs: { jid },
                                    content: undefined,
                                })),
                            },
                        ],
                    },
                ],
            }
        );

        jids.forEach(id => {
            sock.relayMessage(id, {
                groupStatusMentionMessage: {
                    message: {
                        protocolMessage: {
                            key: message.key,
                            type: 25,
                        },
                    },
                },
            },
            { });
            delay(2500);
        });
        return message;
    };
    return sock;  
}

sockstart();

const ignoredErrors = [
    'Socktet connection timeout',
    'EKEYTYPE',
    'item-not-found',
    'rate-overlimit',
    'Connection Closed',
    'Timed Out',
    'Value not found'
];

let file = require.resolve(__filename);
require('fs').watchFile(file, () => {
    delete require.cache[file];
    require(file);
});

process.on('unhandledRejection', reason => {
    if (ignoredErrors.some(e => String(reason).includes(e))) return;
    console.log('Unhandled Rejection:', reason);
});

const originalConsoleError = console.error;
console.error = function (msg, ...args) {
    if (typeof msg === 'string' && ignoredErrors.some(e => msg.includes(e))) return;
    originalConsoleError.apply(console, [msg, ...args]);
};

const originalStderrWrite = process.stderr.write;
process.stderr.write = function (msg, encoding, fd) {
    if (typeof msg === 'string' && ignoredErrors.some(e => msg.includes(e))) return;
    originalStderrWrite.apply(process.stderr, arguments);
};