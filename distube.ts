import { DisTube } from "distube";
import { SpotifyPlugin } from "@distube/spotify";
import { SoundCloudPlugin } from "@distube/soundcloud";
import { YtDlpPlugin } from "@distube/yt-dlp";
import { EmbedBuilder } from "discord.js";
import { ExtendedClient } from "./index";

export function initializeDisTube(client: ExtendedClient) {
    client.distube = new DisTube(client, {
        plugins: [
            new SpotifyPlugin(),
            new SoundCloudPlugin(),
            new YtDlpPlugin(), // カンマを追加
        ],
        emitNewSongOnly: true,
        leaveOnFinish: true,
        leaveOnStop: true,
        savePreviousSongs: true,
        nsfw: true,
        emptyCooldown: 25,
        ytdlOptions: {
            quality: 'highestaudio',
            highWaterMark: 1 << 27, // バッファサイズを増やす
            dlChunkSize: 64 * 1024, // 分割ダウンロードを有効にする
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