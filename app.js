require('dotenv').config()

const { Telegraf } = require('telegraf')

const s = require('sanitize')();
const moment = require('moment'); // require
const JSONdb = require('simple-json-db');
const db = new JSONdb('database.json');
const bot = new Telegraf(process.env.TG_API_KEY)
const pixelWidth = require('string-pixel-width');
const axios = require('axios').default;

function getPercentageChange(o, n) { var d = o - n; return (d / o) * 100; }
function truncateString(str, num) { if (str.length <= num) { return str} return str.slice(0, num) }

function AuthChat(ctx) { if (ctx.chat.id !== parseInt(process.env.CHAT_ID) || ctx.chat.id !== parseInt(process.env.DEV_CHAT_ID)) return; }
async function getEthPrice() { return await axios.get("https://api.etherscan.io/api?module=stats&action=ethprice") }

bot.command('getid', (ctx) => {
    AuthChat(ctx); ctx.replyWithMarkdown(`This chats id is: ${ctx.update.message.chat.id}`)
})
bot.command('sauce', (ctx) => {
    AuthChat(ctx); ctx.replyWithMarkdown(` You can find the Project [here](${process.env.PROJECT_URI}) `)
})

bot.command('balance', (ctx) => {
    AuthChat(ctx);
    const m = ctx.update.message
    const d = m.text.split(' ')

    if (m.text.length === 8) {
        ctx.replyWithMarkdown("You need to set a valid Number, example: ```c++\n/balance " + (Math.random() * 20).toFixed(2) + "``` ")
        return;
    }

    if (d[1].includes(',')) {
        ctx.replyWithMarkdown("Dont use a comma, example: ```c++\n/balance " + (Math.random() * 20).toFixed(2) + "``` ")
        return;
    }

    if (!isNaN(d[1])) { var val = s.value(d[1], 'float') } else {
        ctx.replyWithMarkdown("Input not valid, example: ```c++\n/balance " + (Math.random() * 20).toFixed(2) + "``` ")
        return;
    }

    if (db.has(m.from.id)) {
        const me = db.JSON()[m.from.id]
        const old = me.new
        const updateinc = me.updates + 1

        db.set(
            m.from.id,
            {
                'FirstName': m.from.first_name,
                'Username': m.from.username,
                'new': val,
                'old': old,
                'change': getPercentageChange(val, old),
                'updates': updateinc,
                'lastChanged': moment().format(),
                'firstAdded': me.firstAdded

            }
        )
        ctx.replyWithMarkdown(`${m.from.first_name}'s balance changed ${getPercentageChange(val, old).toFixed(2)}% since last update ${moment(me.lastChanged).fromNow()}`)
    } else {
        db.set(
            m.from.id,
            {
                'FirstName': m.from.first_name,
                'Username': m.from.username,
                'change': 0,
                'new': val,
                'updates': 1,
                'firstAdded': moment().format()
            })

    }
})


bot.command('lb', (ctx) => {
    const m = ctx.update.message
    const dbn = db.JSON()
    let msg = []

    AuthChat(m);

    async function dodo() {
        const ethusd = await getEthPrice()

        if (Object.keys(dbn).length === 0) { ctx.replyWithMarkdown(`LB empty`); return }
        const dbasArray = Object.keys(dbn).map(function (key) {
            return dbn[key];
        })

        const msgs = dbasArray.sort(function (a, b) { return parseFloat(a.new) - parseFloat(b.new) });
        const daad = msgs.reverse()

        for (const user in daad) {
            let balance
            const e = daad[user];
            if (typeof e.Username == "undefined") e.Username = e.FirstName
            const name = truncateString(e.Username, 5).charAt(0).toUpperCase() + truncateString(e.Username, 5).slice(1)
            const namewidth = pixelWidth(name, { size: 14 });


            if (e.new >= 1000) {
                balance = e.new.toFixed(0) + " ";
            } else if (e.new <= 10) {
                balance = e.new.toFixed(3)
            } else if (e.new < 100) {
                balance = e.new.toFixed(2)
            } else if (e.new < 1000) {
                balance = e.new.toFixed(1)
            }

            msg.push("#" + (parseInt(user) + 1) + " "
                + name + " ".repeat(parseInt((46 - namewidth) / 3.9200000000000004))
                + " $" + balance + " ".repeat(parseInt(2))
                + " Δ" + Math.round(e.change) + "%   "
                + " Ξ" + (e.new / ethusd.data.result.ethusd).toFixed(3) + ""
            )
        }
        ctx.replyWithMarkdown(msg.toString().split(',').join('\n'))
    }
    dodo()
})
bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))



