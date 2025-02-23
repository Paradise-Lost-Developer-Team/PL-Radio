import { DisTube } from "distube";
import { SpotifyPlugin } from "@distube/spotify";
import { SoundCloudPlugin } from "@distube/soundcloud";
import { YtDlpPlugin } from "@distube/yt-dlp";
import { EmbedBuilder, Client, Collection } from "discord.js";

// ExtendedClient の定義をローカルに移動
interface ExtendedClient extends Client {
    commands: Collection<string, any>;
    distube: DisTube;
}

export function initializeDisTube(client: ExtendedClient) {
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
            "subboost": "asubboost",
            "karaoke": "stereotools=mlev=0.03",
            "haas": "haas",
            "mcompand": "mcompand"
        },
        emitNewSongOnly: true,
        savePreviousSongs: true,
        nsfw: true,
        emitAddListWhenCreatingQueue: false,
        emitAddSongWhenCreatingQueue: false,
        joinNewVoiceChannel: true,
        ffmpeg: {
            args: [
                '-vn',
                '-b:a', '128k',
                '-ar', '44100',
                '-f', 'wav',
            ],
        },
    });

    client.distube.setMaxListeners(20); // イベントリスナーの最大数を増やす

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
            if (channel) {
                channel.send(`⛔ | エラー: ${e.toString().slice(0, 1974)}`);
            } else {
                console.error(e);
            }
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
        }))
        .on('error', (channel: any, error: any) => {
            if (error.message.includes("This video is only available to Music Premium members")) {
                channel.send("⛔ | この動画はMusic Premiumメンバー専用です。別の動画を選んでください。");
            } else {
                channel.send(`⛔ | エラー: ${error.toString().slice(0, 1974)}`);
            }
        });
}