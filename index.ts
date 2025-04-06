import { Client, Events, GatewayIntentBits, ActivityType, MessageFlags, Collection, EmbedBuilder, TextChannel, ChatInputApplicationCommandData, ChatInputCommandInteraction, GuildTextBasedChannel, ButtonBuilder, ActionRowBuilder, ButtonStyle } from "discord.js";
import { deployCommands } from "./utils/deploy-commands";
import { Player } from "discord-player";
import { REST } from "@discordjs/rest";
import { TOKEN } from "./config.json";
import { ServerStatus } from "./utils/dictionaries";
import { DisTube, Queue, Song, Playlist } from "distube";
import type { Awaitable, DisTubeEvents } from "distube";
import { SpotifyPlugin } from "@distube/spotify";
import { SoundCloudPlugin } from "@distube/soundcloud";
// YouTubePluginは使用しない
// import { YouTubePlugin } from "@distube/youtube";
import { DeezerPlugin } from "@distube/deezer";
import { VoiceStateUpdate } from "./utils/VoiceStateUpdate";
// play-dlを使用
import * as playDl from 'play-dl';

export const followup = async (interaction: ChatInputCommandInteraction, embed: EmbedBuilder, textChannel: GuildTextBasedChannel): Promise<Awaitable<any>> => {
    if (Date.now() - interaction.createdTimestamp < 15 * 60 * 1000) {
        await interaction.followUp({ embeds: [embed] });
    } else { 
        await textChannel.send({ embeds: [embed] });
    }
}
// ExtendedClient の定義をローカルに移動
export interface ExtendedClient extends Client {
    player: Player;
    commands: Collection<string, any>;
    distube: DisTube;
}

class DisTubeClient extends Client<true> {
    distube: DisTube;
    constructor(options: any) {
        super(options);
        // 修正: YouTubePluginを削除し、代わりにplay-dlを使うように設定
        this.distube = new DisTube(this, {
            plugins: [
                new SpotifyPlugin(),
                new SoundCloudPlugin(),
                // YouTubePluginを削除
                new DeezerPlugin()
            ],
            // DisTubeのストリーミング機能にplay-dlを使用
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
        });
        
        // play-dlを使用するようにDisTubeに設定
        (this.distube as any).extractorPlugin = {
            validate: (url: string) => {
                return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/.test(url);
            },
            resolve: async (url: string) => {
                try {
                    const info = await playDl.video_info(url);
                    if (!info) return null;
                    
                    return {
                        id: info.video_details.id,
                        title: info.video_details.title || 'Unknown',
                        duration: info.video_details.durationInSec,
                        thumbnail: info.video_details.thumbnails[0]?.url,
                        url: info.video_details.url
                    };
                } catch (err) {
                    console.error('YouTube解決エラー:', err);
                    return null;
                }
            },
            getStreamByInfo: async (info: any) => {
                try {
                    const stream = await playDl.stream(info.url, { discordPlayerCompatibility: true });
                    return { stream: stream.stream, type: stream.type };
                } catch (err) {
                    console.error('YouTubeストリームエラー:', err);
                    throw err;
                }
            }
        };
    }
}

const client = new DisTubeClient({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent
    ],
}) as unknown as ExtendedClient;

const status = (queue: any) =>
    `音量: \`${queue.volume}%\` |  フィルタ: \`${queue.filters.names.join(', ') || '非アクティブ'}\` | 
    ループ: \`${queue.repeatMode ? (queue.repeatMode === 2 ? 'キュー' : 'トラック') : 'オフ'}\` | 
    自動再生: \`${queue.autoplay ? 'オン' : 'オフ'}\``;

type EventKeys = keyof DisTubeEvents;

client.distube
    .on('playSong' as EventKeys, (queue: Queue, song: Song) => {
        if (queue.textChannel) {
            queue.textChannel.send({
                embeds: [new EmbedBuilder().setColor('#a200ff')
                    .setDescription(`🎶 | 再生中: \`${song.name}\` - \`${song.formattedDuration}\`\nリクエスト者: ${song.user}\n${status(queue)}`)]
            });
        }
    })
    .on('addSong' as EventKeys, (queue: Queue, song: Song) => {
        if (queue.textChannel) {
            queue.textChannel.send({
                embeds: [new EmbedBuilder().setColor('#a200ff')
                    .setDescription(`🎶 | キューに追加: \`${song.name}\` - \`${song.formattedDuration}\` リクエスト者: ${song.user}`)]
            });
        }
    })
    .on('addList' as EventKeys, (queue: Queue, playlist: Playlist) => {
        if (queue.textChannel) {
            queue.textChannel.send({
                embeds: [new EmbedBuilder().setColor('#a200ff')
                    .setDescription(`🎶 | プレイリストから追加: \`${playlist.name}\` : \`${playlist.songs.length}\` 曲; \n${status(queue)}`)]
            });
        }
    })
    .on('error' as EventKeys, (channelOrError: any, errorOrQueue: any) => {
        let error: Error;
        let queue: any;
        if (errorOrQueue instanceof Error) {
            error = errorOrQueue;
            queue = channelOrError;
        } else {
            error = channelOrError;
            queue = errorOrQueue;
        }
        if (error.message.includes("VOICE_CONNECT_FAILED")) {
            console.error("ボイスチャンネルへの接続に失敗しました:", error);
        }
        if (queue && queue.textChannel && typeof queue.textChannel.send === 'function') {
            queue.textChannel.send(`⛔ | エラー: ${error.toString().slice(0, 1974)}`);
        } else {
            console.error('エラー:', error);
        }
    })
    .on('empty' as EventKeys, (channel: any) => channel.send({
        embeds: [new EmbedBuilder().setColor("Red")
            .setDescription('⛔ | ボイスチャンネルが空です! チャンネルを退出します...')]
    }))
    .on('searchNoResult' as EventKeys, (message: any, query: any) =>
        message.channel.send({
            embeds: [new EmbedBuilder().setColor("Red")
                .setDescription(`⛔ | 検索結果が見つかりませんでした: \`${query}\`!`)]
        })
    )
    .on('finish' as EventKeys, (queue: Queue) => {
        if (queue.textChannel) {
            queue.textChannel.send({
                embeds: [new EmbedBuilder().setColor('#a200ff')
                    .setDescription('🏁 | キューが終了しました!')]
            });
        }
    });

client.distube.setMaxListeners(20); // イベントリスナーの最大数を増やす


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
    // コマンドインタラクションの処理
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            // If the interaction has already been acknowledged, try to follow up, otherwise reply
            if (interaction.replied || interaction.deferred) {
                try {
                    await interaction.followUp({ content: 'コマンド実行時にエラーが発生しました', flags: MessageFlags.Ephemeral });
                } catch (e: any) {
                    if (e.code === 10062) return; // Unknown interaction error, nothing more to do
                    if (e.code !== 40060) console.error("FollowUp failed:", e);
                }
            } else {
                try {
                    await interaction.reply({ content: 'コマンド実行時にエラーが発生しました', flags: MessageFlags.Ephemeral });
                } catch (e: any) {
                    if (e.code === 10062) return; // Unknown interaction error, nothing more to do
                    if (e.code !== 40060) console.error("Reply failed:", e);
                }
            }
        }
        return;
    }

    // ボタンインタラクションの処理
    if (interaction.isButton()) {
        try {
            // helpコマンドのページ切り替えボタンの処理
            if (interaction.customId === 'previous' || interaction.customId === 'next') {
                // コマンドのファイルをインポート
                const helpCommand = require('./commands/utility/help');
                
                // 元のメッセージから埋め込みを取得してHelpMenuインスタンスを作成
                const helpMenu = helpCommand.createMenuFromInteraction(interaction);
                
                // ボタンに応じてページを変更
                if (interaction.customId === 'next') {
                    helpMenu.nextPage();
                } else {
                    helpMenu.previousPage();
                }
                
                // 更新されたページの埋め込みとボタンで応答
                const updatedEmbed = helpMenu.getCurrentPage();
                const actionRow = new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('previous')
                            .setLabel('前のページ')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId('next')
                            .setLabel('次のページ')
                            .setStyle(ButtonStyle.Primary)
                    );
                
                await interaction.update({
                    content: updatedEmbed.data.description ?? '',
                    embeds: [updatedEmbed],
                    components: [actionRow]
                });
            }
        } catch (error) {
            console.error('ボタンインタラクションの処理中にエラーが発生しました:', error);
            try {
                await interaction.reply({ content: 'ボタン操作中にエラーが発生しました', ephemeral: true });
            } catch (e) {
                console.error('エラー応答の送信に失敗しました:', e);
            }
        }
    }
});

// サーバー参加時のウェルカムメッセージイベントを追加
client.on(Events.GuildCreate, async guild => {
    // 送信可能な最初のテキストチャンネルを探す
    const targetChannel = guild.channels.cache.find(
        channel => channel.isTextBased() && channel.permissionsFor(guild.members.me!)?.has('SendMessages')
    ) as TextChannel;

    if (!targetChannel) return; // 送信可能なチャンネルがない場合は何もしない

    // ウェルカムメッセージ用の埋め込みを作成
    const welcomeEmbed = new EmbedBuilder()
        .setColor('#a200ff')
        .setTitle('PL-Radioをご利用いただきありがとうございます！')
        .setDescription('音楽再生Botとして、様々な音楽プラットフォームから音楽を再生することができます。')
        .addFields(
            { name: '🎵 基本的な使い方', value: '`/play [曲名/URL]` コマンドで音楽を再生できます。' },
            { name: '📋 その他のコマンド', value: '`/help` コマンドで全コマンドリストを確認できます。' }
        )
        .setFooter({ text: 'サポートが必要な場合は、開発者にお問い合わせください。' })
        .setTimestamp();

    // 利用規約とプライバシーポリシーのリンクボタンを作成
    const termsButton = new ButtonBuilder()
        .setLabel('利用規約')
        .setStyle(ButtonStyle.Link)
        .setURL('https://paradise-lost-developer-team.github.io/PL-Radio/Term-of-Service/'); 

    const privacyButton = new ButtonBuilder()
        .setLabel('プライバシーポリシー')
        .setStyle(ButtonStyle.Link)
        .setURL('https://paradise-lost-developer-team.github.io/PL-Radio/Privacy-Policy/'); 

    const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(termsButton, privacyButton);

    // 埋め込みメッセージとボタンを送信
    await targetChannel.send({ 
        embeds: [welcomeEmbed],
        components: [row]
    });
    
    // サーバーステータスの初期化
    new ServerStatus(guild.id);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error("Promiseが拒否されました。", reason);
});

client.login(TOKEN);