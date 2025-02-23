import { Client, Events, ActivityType, MessageFlags, Collection } from "discord.js";
import { deployCommands } from "./deploy-commands";
import { Player } from "discord-player";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { TOKEN } from "./config.json";
import { ServerStatus } from "./dictionaries";
import fs from "node:fs";
import path from "node:path";

interface ExtendedClient extends Client {
    player: Player;
    commands: Collection<string, any>;
}

export const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_VOICE_STATES
    ],
}) as ExtendedClient; 

client.commands = new Collection();

const rest = new REST({ version: '9' }).setToken(TOKEN);

client.player = new Player(client, {
    ytdlOptions: {
        quality: 'highestaudio',
        highWaterMark: 1 << 25
    }
});

client.once(Events.ClientReady, async () => {
    console.log("起動完了");
    await deployCommands();
    client.user!.setActivity("起動中…", { type: ActivityType.Playing });
    setInterval(async () => {
        const joinServerCount = client.guilds.cache.size;
        await client.user!.setActivity(`サーバー数: ${joinServerCount}`, { type: ActivityType.Custom });
        await new Promise(resolve => setTimeout(resolve, 15000));
        const joinVCCount = client.voice.adapters.size;
        client.user!.setActivity(`VC: ${joinVCCount}`, { type: ActivityType.Custom });
        await new Promise(resolve => setTimeout(resolve, 15000));
    }, 30000);
    client.guilds.cache.forEach(guild => {
        new ServerStatus(guild.id);
    })
});

client.on(Events.InteractionCreate, async interaction => {    
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        // 既に応答済みの場合は followUp を使う
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'コマンド実行時にエラーが発生しました', ephemeral: true });
        } else {
            await interaction.reply({ content: 'コマンド実行時にエラーが発生しました', ephemeral: true });
        }
    }
});

client.login(TOKEN);