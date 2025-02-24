import { Client, Events, GatewayIntentBits, ActivityType, MessageFlags, Collection, EmbedBuilder } from "discord.js";
import { deployCommands } from "./deploy-commands";
import { Player } from "discord-player";
import { REST } from "@discordjs/rest";
import { TOKEN } from "./config.json";
import { ServerStatus } from "./dictionaries";
import { DisTube, Queue, Song, Playlist, DisTubeEvents } from "distube";
import { SpotifyPlugin } from "@distube/spotify";
import { SoundCloudPlugin } from "@distube/soundcloud";
import { YtDlpPlugin } from "@distube/yt-dlp";
import { VoiceStateUpdate } from "./VoiceStateUpdate";

// ExtendedClient の定義をローカルに移動
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

    client.distube = new DisTube(client, {
        plugins: [
            new SpotifyPlugin(),
            new SoundCloudPlugin(),
            new YtDlpPlugin(),
        ],
        customFilters: {
            "8D": "apulsator=hz=0.08",
            "gate": "agate",
            "haas": "haas",
            "reverse": "areverse",
            "flanger": "flanger",
            "subboost": "asubboost",
            "vaporwave": "aresample=48000,asetrate=48000*0.8",
            "nightcore": "aresample=48000,asetrate=48000*1.25",
            "phaser": "aphaser",
            "tremolo": "tremolo",
            "vibrato": "vibrato=f=6.5",
            "treble": "treble=g=5",
            "normalizer": "dynaudnorm=f=200",
            "surrounding": "surround",
            "pulsator": "apulsator=hz=1",
            "karaoke": "stereotools=mlev=0.03",
            "mcompand": "mcompand"
        },
        emitNewSongOnly: true,
        savePreviousSongs: true,
        nsfw: true,
        emitAddListWhenCreatingQueue: false,
        emitAddSongWhenCreatingQueue: false,
        joinNewVoiceChannel: true,
        }
    );


    type EventKeys = keyof DisTubeEvents;

    client.distube.setMaxListeners(20); // イベントリスナーの最大数を増やす

    const status = (queue: any) =>
        `音量: \`${queue.volume}%\` |  フィルタ: \`${queue.filters.names.join(', ') || '非アクティブ'}\` | ループ: \`${queue.repeatMode ? (queue.repeatMode === 2 ? 'キュー' : 'トラック') : 'オフ'}\` | 自動再生: \`${queue.autoplay ? 'オン' : 'オフ'}\``;

    client.distube
        .on('playSong' as keyof DisTubeEvents, (queue: Queue, song: Song) => {
            if (queue.textChannel) {
                if (queue.textChannel) {
                    queue.textChannel.send({
                        embeds: [new EmbedBuilder().setColor('#a200ff')
                            .setDescription(`🎶 | 再生中: \`${song.name}\` - \`${song.formattedDuration}\`\nリクエスト者: ${song.user}\n${status(queue)}`)]
                    });
                }
            }
        })
        .on('addSong' as keyof DisTubeEvents, (queue: Queue, song: Song) => {
            if (queue.textChannel) {
                if (queue.textChannel) queue.textChannel.send({
                    embeds: [new EmbedBuilder().setColor('#a200ff')
                        .setDescription(`🎶 | キューに追加: \`${song.name}\` - \`${song.formattedDuration}\` リクエスト者: ${song.user}`)]
                });
            }
        })
        .on('addList' as keyof DisTubeEvents, (queue: Queue, playlist: Playlist) => {
            if (queue.textChannel) {
                queue.textChannel.send({
                    embeds: [new EmbedBuilder().setColor('#a200ff')
                        .setDescription(`🎶 | プレイリストから追加: \`${playlist.name}\` : \`${playlist.songs.length}\` 曲; \n${status(queue)}`)]
                });
            }
        })
        .on('error' as keyof DisTubeEvents, (channelOrError: any, errorOrQueue: any) => {
            // エラーイベントのパラメータ順が異なる場合に備え、両方のパターンをチェック
            let error: Error;
            let queue: any;
            if (errorOrQueue instanceof Error) {
                error = errorOrQueue;
                queue = channelOrError;
            } else {
                error = channelOrError;
                queue = errorOrQueue;
            }
            // VOICE_CONNECT_FAILED エラーなら追加ログ等
            if (error.message.includes("VOICE_CONNECT_FAILED")) {
                console.error("ボイスチャンネルへの接続に失敗しました:", error);
            }
            if (queue && queue.textChannel && typeof queue.textChannel.send === 'function') {
                queue.textChannel.send(`⛔ | エラー: ${error.toString().slice(0, 1974)}`);
            } else {
                console.error('エラー:', error);
            }
        })
        .on('empty' as keyof DisTubeEvents, (channel: any) => channel.send({
            embeds: [new EmbedBuilder().setColor("Red")
                .setDescription('⛔ | ボイスチャンネルが空です! チャンネルを退出します...')]
        }))
        .on('searchNoResult' as keyof DisTubeEvents, (message: any, query: any) =>
            message.channel.send({
                embeds: [new EmbedBuilder().setColor("Red")
                    .setDescription(`⛔ | 検索結果が見つかりませんでした: \`${query}\`!`)]
            })
        )
        .on('finish' as keyof DisTubeEvents, (queue: Queue) => {
            if (queue.textChannel) {
                queue.textChannel.send({
                    embeds: [new EmbedBuilder().setColor('#a200ff')
                        .setDescription('🏁 | キューが終了しました!')]
                });
            }
        });

client.commands = new Collection(); // client.commands を初期化

const rest = new REST({ version: '9' }).setToken(TOKEN);

client.once(Events.ClientReady, async () => {
    console.log("起動完了");
    await deployCommands(client); // client を引数として渡す
    VoiceStateUpdate(client);
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
        // If the interaction has already been acknowledged, try to follow up, otherwise replyen acknowledged, try to follow up, otherwise reply
        if (interaction.replied || interaction.deferred) {
            try {
                await interaction.followUp({ content: 'コマンド実行時にエラーが発生しました', flags: MessageFlags.Ephemeral });
            } catch (e: any) {
                if (e.code === 10062) return; // Unknown interaction error, nothing more to do nothing more to do
                if (e.code !== 40060) console.error("FollowUp failed:", e);   if (e.code !== 40060) console.error("FollowUp failed:", e);
            }
        } else {
            try {
                await interaction.reply({ content: 'コマンド実行時にエラーが発生しました', flags: MessageFlags.Ephemeral });
            } catch (e: any) {
                if (e.code === 10062) return; // Unknown interaction error, nothing more to do   if (e.code === 10062) return; // Unknown interaction error, nothing more to do
                if (e.code !== 40060) console.error("Reply failed:", e);       if (e.code !== 40060) console.error("Reply failed:", e);
            }
        }
    }
});

process.on('unhandledRejection', (reason, promise) => {
    console.error("Promiseが拒否されました。", reason);
});

client.login(TOKEN);