const Discord = require('discord.js');
const db = require("quick.db")
module.exports = {
    name: 'rank',
    aliases: ['invites', "davetsayım"],
    run: async (client, message, args) => {
        let member = message.mentions.users.first() || message.author || message.guild.members.cache.get(args[0]);
        let embed = new Discord.MessageEmbed().setAuthor(`${member.username}`, member.avatarURL({ dynamic: true })).setFooter(`Aello was here`).setTimestamp().setColor("00f1ff")
        let davetsayi = db.fetch(`davetsayi.${member.id}.${message.guild.id}`)
        let fake = db.fetch(`fake.${member.id}.${message.guild.id}`)
        let toplam = db.fetch(`toplam.${member.id}.${message.guild.id}`)
        let günlük = db.fetch(`günlük.${member.id}.${message.guild.id}`)
        let sayi = günlük ? message.guild.members.cache.filter((m) => günlük.some((x) => x.userID === m.user.id) && Date.now() - m.joinedTimestamp < 1000 * 60 * 60 * 24).size : "0";
        message.channel.send(embed.setDescription(`Toplam **${toplam ? toplam : '0'}** davetin mevcut. (**${davetsayi ? davetsayi : '0'}** gerçek, **${fake ? fake : '0'}** fake, **${sayi ? sayi : '0'}** günlük)`))
    }
}