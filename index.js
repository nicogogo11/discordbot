const { Client, GatewayIntentBits, Collection, ActivityType, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const mongoose = require('mongoose');
const botConfig = require("./botConfig.json");
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');


mongoose.connect('mongodb+srv://faktury:eTzSq37I54UP3bZU@cluster0.s36ck5j.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    useUnifiedTopology: true,
    useNewUrlParser: true
}).then(console.log('connected to mongo db!'));

const slashCommands = [];
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers
    ]
});
module.exports.Client = client;

client.once('ready', async () => {
    console.log('Connected to Discord and ready.');

    // Set the bot's activity
    client.user.setActivity('faktury', { type: ActivityType.Watching });
    // Load and register slash commands from commands folder
    const commandsPath = path.join(__dirname, "commands");
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

    commandFiles.forEach(file => {
        const command = require(path.join(commandsPath, file));
        client.commands.set(command.data.name, command);
        slashCommands.push(command.data.toJSON());
        console.log(`Loaded ${command.data.name}`);
    });

    const clientId = botConfig.clientID;
    const token = botConfig.token;
    const rest = new REST({ version: '10' }).setToken(token);

    client.guilds.cache.forEach((guild) => {
        console.log(`Commands loaded in: ${guild.name}`);
    });
    try {
        await rest.put(Routes.applicationCommands(clientId), { body: slashCommands });
        console.log('Successfully registered application commands');
    } catch (error) {
        console.error(`Error registering application commands: ${error}`);
    }

});



client.commands = new Collection();
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"));

for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file));
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

client.login(botConfig.token);
