const Discord = require("discord.js");
const client = new Discord.Client();
const db = require("quick.db");
const config = require("./jahky.json");
const fs = require("fs");
const commands = client.commands = new Discord.Collection();
const aliases = client.aliases = new Discord.Collection();

fs.readdirSync('./commands', { encoding: 'utf8' }).filter(file => file.endsWith(".js")).forEach((files) => {
    let command = require(`./commands/${files}`);
    if (!command.name) return console.log(`Hatalı Kod Dosyası => [/commands/${files}]`)
    commands.set(command.name, command);
    if (!command.aliases || command.aliases.length < 1) return
    command.aliases.forEach((otherUses) => { aliases.set(otherUses, command.name); })
})


client.on('message', message => {
    const prefix = config.prefix; // prefix
    if (!message.guild || message.author.bot || !message.content.startsWith(prefix)) return;
    const args = message.content.slice(1).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    const cmd = client.commands.get(command) || client.commands.get(client.aliases.get(command))
    if (!cmd) return;
    cmd.run(client, message, args)
})

client.on("ready", () => {
    client.user.setPresence({ activity: { name: "Uqiret ❤️ Osmivo" }, status: "online" });
});

client.on("ready", () => {
    const ses = client.channels.cache.get(config.ses)
    if (!ses) return
    ses.join()
})

const invites = {};
const wait = require("util").promisify(setTimeout);
client.on('ready', () => {
    wait(1000);
    client.guilds.cache.forEach(g => {
        g.fetchInvites().then(guildInvites => {
            invites[g.id] = guildInvites;
        });
    });
})

client.on('guildMemberAdd', (member) => {
    if (member.user.bot) return;
    const user = client.users.cache.get(member.id);
    member.guild.fetchInvites().then(async guildInvites => {
        const ei = invites[member.guild.id];
        invites[member.guild.id] = guildInvites;
        const veri = await guildInvites.find(i => (ei.get(i.code) == null ? (i.uses - 1) : ei.get(i.code).uses) < i.uses);
        var daveteden;
        if (!veri) daveteden = "Bulunamadı"
        else daveteden = member.guild.members.cache.get(veri)
        var b = veri.Guild.vanityURLCode
        if (!b) b = veri.code
        if (veri.code == b) daveteden = member.guild.members.cache.get(veri.inviter.id)
        else daveteden = member.guild;
        db.add(`davetsayi.${daveteden.id}.${member.guild.id}`, +1);
        db.add(`toplam.${daveteden.id}.${member.guild.id}`, +1);
        db.push(`günlük.${daveteden.id}.${member.guild.id}`, { userID: member.user.id })
        let zaman = require("moment").duration(new Date().getTime() - client.users.cache.get(member.id).createdAt.getTime())
        if (zaman < 604800017) {
            db.add(`davetsayi.${daveteden.id}.${member.guild.id}`, -1);
            db.add(`fake.${daveteden.id}_${member.guild.id}`, +1);
        }
        db.set(`veri.${member.id}.${member.guild.id}`, daveteden.id);
        let a = await db.fetch(`davetsayi.${daveteden.id}.${member.guild.id}`);
        let davetsayi;
        if (!a) { davetsayi = 0; }
        else { davetsayi = await db.fetch(`davetsayi.${daveteden.id}.${member.guild.id}`); }
        var y;
        if (daveteden.id == member.guild.id) y = "Özel URL"
        else y = daveteden.user.tag
        member.guild.channels.cache.get(config.logchannel).send(`${member} kullanıcısı sunucuya katıldı! **Davet Eden:** ${y} ( **${davetsayi ? davetsayi : '0'}** davet )`);
    });
});

client.on("guildMemberRemove", async member => {
    const user = client.users.cache.get(member.id);

    member.guild.fetchInvites().then(async guildInvites => {
        const veri = await db.fetch(`veri.${member.id}.${member.guild.id}`);
        var daveteden;
        if (!veri) daveteden = "Bulunamadı"
        else daveteden = member.guild.members.cache.get(veri)

        let zaman = require("moment").duration(new Date().getTime() - client.users.cache.get(member.id).createdAt.getTime())

        if (zaman < 1296000000) {
            db.add(`fake.${daveteden.id}.${member.guild.id}`, -1);
            db.add(`davetsayi.${daveteden.id}.${member.guild.id}`, -1);
            if (veri) {
                db.delete(`veri.${member.id}.${member.guild.id}`);
            }
        } else {
            db.add(`davetsayi.${daveteden.id}.${member.guild.id}`, -1);
            if (veri) {
                db.delete(`veri.${member.id}.${member.guild.id}`);
            }
        }
        var y;
        if (daveteden.id == member.guild.id) y = "Özel URL"
        else y = daveteden.user
        const davetsayi = await db.fetch(`davetsayi.${daveteden.id}.${member.guild.id}`);
        if (zaman < 1296000000) {
            if (!veri) {
                return member.guild.channels.cache.get(config.logchannel).send(`Sunucudan <@${member.user.tag}> çıkış yaptı. **Davet eden:** Bulunamadı.`);
            } else if (daveteden.id == member.guild.id) {
                member.guild.channels.cache.get(config.logchannel).send(`Sunucudan \`${member.user.tag}\`, çıkış yaptı. **Davet eden:** ${y.tag}, ${davetsayi ? davetsayi : '0'} daveti kaldı!`);
            } else {
                member.guild.channels.cache.get(config.logchannel).send(`Sunucudan \`${member.user.tag}\`, çıkış yaptı. **Davet eden:** ${y.tag}, ${davetsayi ? davetsayi : '0'} daveti kaldı!`);
            }
        } else {
            {
                if (!veri) {
                     member.guild.channels.cache.get(config.logchannel).send(`\`${member.user.tag}\` çıktı, **Davet eden:** Bulunamadı!`);
                } else if (daveteden.id == member.guild.id) {
                    member.guild.channels.cache.get(config.logchannel).send(`Sunucudan \`${member.user.tag}\`, çıkış yaptı. **Davet eden:** ${y.tag}, ${davetsayi ? davetsayi : '0'} daveti kaldı!`);
                } else {
                    member.guild.channels.cache.get(config.logchannel).send(`Sunucudan \`${member.user.tag}\`, çıkış yaptı. **Davet eden:** ${y.tag}, ${davetsayi ? davetsayi : '0'} daveti kaldı!`);
                }
            }
        }
    })
});

client.login(config.token).then(() => console.log(`${client.user.username} Olarak Giriş Yapıldı Aello x Osmivo`)).catch(() => console.log("Bot Giriş Yaparken Bir Sorun Oluştu"))