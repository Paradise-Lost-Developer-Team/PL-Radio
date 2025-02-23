import { Client, Events, GatewayIntentBits, ActivityType, MessageFlags, Collection, EmbedBuilder } from "discord.js";
import { deployCommands } from "./deploy-commands";
import { Player } from "discord-player";
import { REST } from "@discordjs/rest";
import { TOKEN } from "./config.json";
import { ServerStatus } from "./dictionaries";
import fs from "node:fs";
import path from "node:path";
// ※ DisTube の Events は discord.js と重複するため、エイリアスを利用
import { DisTube, Events as DisTubeEvents } from "distube";
import { SpotifyPlugin } from "@distube/spotify";
import { SoundCloudPlugin } from "@distube/soundcloud";
import { YtDlpPlugin } from "@distube/yt-dlp";

// 不要な FFMPEG_PATH 関連コードは削除またはコメントアウト
// const FFMPEG_PATH = path.join(__dirname, "C:\\ffmpeg\\bin\\ffmpeg.exe");
// client.distube.on(DisTubeEvents.FFMPEG_PATH, console.log);

export interface ExtendedClient extends Client {
    player: Player;
    commands: Collection<string, any>;
    distube: DisTube;
}

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates
    ],
}) as ExtendedClient;

client.commands = new Collection();

client.distube = new DisTube(client, {
    plugins: [
        new SpotifyPlugin(),
        new SoundCloudPlugin(),
        new YtDlpPlugin(), // カンマを追加
    ]
});

const status = (queue: any) =>
    `音量: \`${queue.volume}%\` |  フィルタ: \`${queue.filters.names.join(', ') || '非アクティブ'}\` | リピート: \`${queue.repeatMode ? (queue.repeatMode === 2 ? 'キュー' : 'トラック') : 'オフ'}\` | 自動再生: \`${queue.autoplay ? 'オン' : 'オフ'}\``;

client.distube
    .on('playSong', (queue: any, song: any) =>
        queue.textChannel.send({
            embeds: [new EmbedBuilder().setColor('#a200ff')
                .setDescription(`🎶 | 再生中: \`${song.name}\` - \`${song.formattedDuration}\`\nリクエスト者: ${song.user}\n${status(queue)}`)]
        })
    )
    .on('addSong', (queue: any, song: any) =>
        queue.textChannel.send({
            embeds: [new EmbedBuilder().setColor('#a200ff')
                .setDescription(`🎶 | キューに追加: \`${song.name}\` - \`${song.formattedDuration}\` リクエスト者: ${song.user}`)]
        })
    )
    .on('addList', (queue: any, playlist: any) =>
        queue.textChannel.send({
            embeds: [new EmbedBuilder().setColor('#a200ff')
                .setDescription(`🎶 | プレイリストから追加: \`${playlist.name}\` : \`${playlist.songs.length}\` 曲; \n${status(queue)}`)]
        })
    )
    .on('error', (channel: any, e: any) => {
        if (channel) channel.send(`⛔ | エラー: ${e.toString().slice(0, 1974)}`);
        else console.error(e);
    })
    .on('empty', (channel: any) => channel.send({
        embeds: [new EmbedBuilder().setColor("Red")
            .setDescription('⛔ | ボイスチャンネルが空です! チャンネルを退出します...')]
    }))
    .on('searchNoResult', (message: any, query: any) =>
        message.channel.send({
            embeds: [new EmbedBuilder().setColor("Red")
                .setDescription('`⛔ | 検索結果が見つかりませんでした: \`${query}\`!`')]
        })
    )
    .on('finish', (queue: any) => queue.textChannel.send({
        embeds: [new EmbedBuilder().setColor('#a200ff')
            .setDescription('🏁 | キューが終了しました!')]
    }));

const rest = new REST({ version: '9' }).setToken(TOKEN);

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