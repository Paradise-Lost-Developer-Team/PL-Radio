import { Client, Events, GatewayIntentBits, ActivityType, MessageFlags, Collection, EmbedBuilder } from "discord.js";
import { deployCommands } from "./deploy-commands";
import { Player } from "discord-player";
import { REST } from "@discordjs/rest";
import { TOKEN } from "./config.json";
import { ServerStatus } from "./dictionaries";
import fs from "node:fs";
import path from "node:path";
import { initializeDisTube } from "./distube"; // distube.ts から関数をインポート

export interface ExtendedClient extends Client {
    player: Player;
    commands: Collection<string, any>;
    distube: DisTube;
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates
    ],
}) as ExtendedClient;

client.commands = new Collection(); // client.commands を初期化

const rest = new REST({ version: '9' }).setToken(TOKEN);

client.once(Events.ClientReady, async () => {
    console.log("起動完了");
    await deployCommands(client); // client を引数として渡す
    initializeDisTube(client); // DisTube を初期化
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
    });
});

client.on(Events.InteractionCreate, async interaction => {    
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'コマンド実行時にエラーが発生しました', flags: MessageFlags.Ephemeral });
        } else {
            await interaction.reply({ content: 'コマンド実行時にエラーが発生しました', flags: MessageFlags.Ephemeral });
        }
    }
});

client.login(TOKEN);

module.exports = { client };