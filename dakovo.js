let Discord = require("discord.js")
let bot = new Discord.Client()
let fs = require("fs")

let config = JSON.parse(fs.readFileSync("./config.json","utf8"))

let prefix = config.prefix


const {promisify} = require("util")
const write = promisify(fs.writeFile)
var saveEnCours = false

async function save(file){
    switch(file){
        case "config":
            if(!saveEnCours){
                saveEnCours  = true
                await write("config.json", JSON.stringify(config,null,'\t'))
                saveEnCours  = false
            }
        break;
        default:
            return console.log("Fichier de sauvegarde introuvable !")
    }
}

bot.login(config.token)

bot.on("ready", () => {
    console.log("Bot connecté !")
    bot.user.setPresence({ activity: { name: '',type:"PLAYING"}, status: 'online' })
})

bot.on("message",async function(message){
    if(message.author.bot) return
    let args = message.content.split(" ").slice(1).join(" ")

    if(message.content.toLowerCase().startsWith(prefix + "close")){
        if(message.channel.type === "dm"){
            let find = bot.guilds.cache.get(config.mainGuild).channels.cache.find(e => e.topic === message.author.id)
            if(!find) return
            message.channel.send({embed:{
                color:15158332,
                description:"Le correspondant a annulé sa demande d'assitance ❌ "
            }})
            find.send({embed:{
                color:15158332,
                author:{
                    name:"Fermeture !",
                    icon_url:message.author.displayAvatarURL()
                },
                description:"Le correspondant a annuler sa demande de wl ❌ !"
            }})
            setTimeout(() => find.delete(),3000)
        } else {
            if(message.channel.topic.length !== 18 || isNaN(message.channel.topic)) return
            let personne = bot.users.cache.get(message.channel.topic)
            if(personne) personne.createDM().then(channel => channel.send({embed:{
                color:15158332,
                description:"🔒 Votre ticket a été fermé"
            }}))
            message.channel.send({embed:{
                color:15158332,
                author:{
                    name:"Fermeture !",
                    icon_url:message.author.displayAvatarURL()
                },
                description:"Vous avez demandé la fermeture du ticket !"
            }})
            setTimeout(() => message.channel.delete(),3000)
        }
        return
    }

    if(message.channel.type === "dm"){
        let content = message.content
        if(content === "") return
        let guild = bot.guilds.cache.get(config.mainGuild)
        if(!guild) return erreur("Une erreur est survenue, veuillez patienter !",message.channel.id)
        let already = bot.guilds.cache.get(config.mainGuild).channels.cache.find(e => e.topic === message.author.id)
        if(already){
            already.send({embed:{
                color:15158332,
                author:{
                    name:message.author.tag,
                    icon_url:message.author.displayAvatarURL()
                },
                description:content
            }})
        } else {
            message.channel.send({embed:{
                color:15158332, 
                author:{
                    name:"Succès !",
                    icon_url:bot.user.displayAvatarURL()
                },
                description:"---------------",
                footer:{
                    text:"🪐 Un staff va vous prendre en charge. Merci de ne pas spam !"
                }
            }})

            guild.channels.create("📤 TICKET -" + config.number,{type:"text"}).then(channel => {
              config.number++
              save("config")
              channel.setTopic(message.author.id)
              if(config.ticketCategory !== "") channel.setParent(config.ticketCategory).then(chan => chan.lockPermissions())
              channel.send({embed:{
                  color:15158332,
                  author:{
                      name:"Demande d'Aide reçu!",
                      icon_url:message.author.displayAvatarURL()
                  },
                  description:content
              }})
            })
        }
    }

    let id = (message.channel.topic === "" ? undefined : message.channel.topic)
    if(id){
        if(isNaN(id) || id.length !== 18) return
        let personne = bot.users.cache.get(id)
        if(!personne) return erreur("Le correspondant n'est plus joignable !",message.channel.id)
        let content = message.content
        if(content === "") return
        personne.createDM().then(channel => {
            if(!channel) return
            channel.send({embed:{
                color:15158332,
                author:{
                    name:message.author.tag,
                    icon_url:message.author.displayAvatarURL()
                },
                description:content
            }}).catch(err => {
                if(err) return erreur("Le correspondant a bloqué ses messages privés !",message.channel.id)
            })
        })
    }

    

})




function erreur(message,channel){
    bot.channels.cache.get(channel).send({embed:{
        color:0xc44f51,
        author:{
            name:"Erreur !"
        },
        description:message
    }})
}


