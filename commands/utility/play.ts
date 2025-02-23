import { SlashCommandBuilder } from '@discordjs/builders';
import { EmbedBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { QueryType } from 'discord-player';
import { client } from '../../index';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('音楽を再生します')
        .addSubcommand(sub =>
            sub
                .setName('search')
                .setDescription('音楽を検索して再生します')
                .addStringOption(option =>
                    option
                        .setName('searchterms')
                        .setDescription('検索キーワード')
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub
                .setName('playlist')
                .setDescription('プレイリストから再生します')
                .addStringOption(option =>
                    option
                        .setName('url')
                        .setDescription('再生するプレイリストのURL')
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub
                .setName('song')
                .setDescription('曲を再生します')
                .addStringOption(option =>
                    option
                        .setName('url')
                        .setDescription('再生する曲のURL')
                        .setRequired(true)
                )
        ),
    // interaction 単体を引数にするように変更
    execute: async (interaction: ChatInputCommandInteraction) => {
        if (!interaction.guild) {
            await interaction.reply({ content: 'このコマンドはサーバー専用です。', flags: MessageFlags.Ephemeral });
            return;
        }
        // interaction.member の存在チェック
        if (!interaction.member) {
            await interaction.reply({ content: 'メンバー情報が取得できませんでした。', flags: MessageFlags.Ephemeral });
            return;
        }
        const member = interaction.member as any;
        if (!member.voice || !member.voice.channel) {
            await interaction.reply({ content: 'ボイスチャンネルに接続してください。', flags: MessageFlags.Ephemeral });
            return;
        }
        // キュー生成
        const queue = client.player.queues.create(interaction.guild.id, { metadata: { channel: interaction.channel } });
        if (!queue.connection) await queue.connect(member.voice.channel);

        let embed = new EmbedBuilder();
        if (interaction.options.getSubcommand() === 'song') {
            const url = interaction.options.getString('url');
            const result = await client.player.search(url!, {
                requestedBy: interaction.user,
                searchEngine: QueryType.YOUTUBE_VIDEO
            });
            if (result.tracks.length === 0) {
                await interaction.reply({ content: '曲を検索できませんでした', flags: MessageFlags.Ephemeral });
                return;
            }
            const song = result.tracks[0];
            await queue.addTrack(song);
            embed
                .setDescription(`キューへ**[${song.title}](${song.url})** 追加されました。`)
                .setThumbnail(song.thumbnail)
                .setFooter({ text: `再生時間: ${song.duration}` });
        } else if (interaction.options.getSubcommand() === 'playlist') {
            const url = interaction.options.getString('url');
            const result = await client.player.search(url!, {
                requestedBy: interaction.user,
                searchEngine: QueryType.YOUTUBE_PLAYLIST
            });
            if (result.tracks.length === 0) {
                await interaction.reply({ content: 'プレイリストを検索できませんでした', flags: MessageFlags.Ephemeral });
                return;
            }
            for (const track of result.tracks) {
                await queue.addTrack(track);
            }
            embed
                .setDescription(`キューに**${result.tracks.length}**曲追加されました。`)
                .setThumbnail(result.tracks[0].thumbnail)
                .setFooter({ text: `再生時間: 不明` });
        } else if (interaction.options.getSubcommand() === 'search') {
            const searchterms = interaction.options.getString('searchterms');
            const result = await client.player.search(searchterms!, {
                requestedBy: interaction.user,
                searchEngine: QueryType.AUTO,
            });
            if (result.tracks.length === 0) {
                await interaction.reply({ content: '曲を検索できませんでした', flags: MessageFlags.Ephemeral });
                return;
            }
            const song = result.tracks[0];
            await queue.addTrack(song);
            embed
                .setDescription(`キューへ**[${song.title}](${song.url})** 追加されました。`)
                .setThumbnail(song.thumbnail)
                .setFooter({ text: `再生時間: ${song.duration}` });
        }
        if (!queue.node.isPlaying()) await queue.node.play();
        await interaction.reply({ embeds: [embed] });
    }
};
