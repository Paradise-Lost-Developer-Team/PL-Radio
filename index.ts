// Add global error handlers at the top:
process.on('uncaughtException', error => {
    console.error('Uncaught Exception:', error);
});
process.on('unhandledRejection', error => {
    console.error('Unhandled Rejection:', error);
});

import { Client, Events, GatewayIntentBits, ActivityType, MessageFlags, Collection } from "discord.js";
import { deployCommands } from "./deploy-commands";
import { Player } from "discord-player";
import { REST } from "@discordjs/rest";
import { TOKEN } from "./config.json";
import { ServerStatus } from "./dictionaries";
import { SpotifyExtractor } from '@discord-player/extractor';  // 追加

interface ExtendedClient extends Client {
    player: Player;
    commands: Collection<string, any>;
}

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ], 
}) as ExtendedClient; 
client.commands = new Collection();

const rest = new REST({ version: '9' }).setToken(TOKEN);

client.player = new Player(client);

// 追加: "playerError" イベントリスナーを登録
(client.player as any).on("playerError", (queue: any, error: Error) => {
    console.error(`Player error (playerError event) in guild ${queue.guild.id}: ${error.message}`);
});

// 追加: プレイヤーエラーイベントのリスナーを登録
client.player.on("error", (error: Error) => {
    console.error(`Player error: ${error.message}`);
});

// Remove or comment out this line:
// client.player.extractors.register(SpotifyExtractor, {});

client.once(Events.ClientReady, async () => {
    // 追加: Extractorsの非同期登録
    await client.player.extractors.register(SpotifyExtractor, {});

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