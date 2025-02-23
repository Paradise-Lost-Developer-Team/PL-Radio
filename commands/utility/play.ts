import { SlashCommandBuilder } from '@discordjs/builders';
import { EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import { QueryType } from 'discord-player';
import { ExtendedClient } from '../../index';

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
    execute: async (args: { client: ExtendedClient; interaction: ChatInputCommandInteraction }) => {
        const { client, interaction } = args;
        const member = interaction.member as any;
        if (!member || !member.voice || !member.voice.channel) {
            await interaction.reply({ content: 'ボイスチャンネルに接続してください。', ephemeral: true });
            return;
        }
        // キュー生成は queues.create を利用
        const queue = client.player.queues.create(interaction.guild!.id, { metadata: { channel: interaction.channel } });
        if (!queue.connection) await queue.connect(member.voice.channel);
        
        let embed = new EmbedBuilder();
        // サブコマンド 'song'
        if (interaction.options.getSubcommand() === 'song') {
            const url = interaction.options.getString('url');
            const result = await client.player.search(url!, {
                requestedBy: interaction.user,
                searchEngine: QueryType.YOUTUBE_VIDEO
            });
            if (result.tracks.length === 0) {
                await interaction.reply({ content: '曲を検索できませんでした', ephemeral: true });
                return;
            }
            const song = result.tracks[0];
            await queue.addTrack(song);
            embed
                .setDescription(`キューへ**[${song.title}](${song.url})** 追加されました。`)
                .setThumbnail(song.thumbnail)
                .setFooter({ text: `再生時間: ${song.duration}` });
        }
        // サブコマンド 'playlist'
        else if (interaction.options.getSubcommand() === 'playlist') {
            const url = interaction.options.getString('url');
            const result = await client.player.search(url!, {
                requestedBy: interaction.user,
                searchEngine: QueryType.YOUTUBE_PLAYLIST
            });
            if (result.tracks.length === 0) {
                await interaction.reply({ content: 'プレイリストを検索できませんでした', ephemeral: true });
                return;
            }
            // 各トラックを順次追加
            for (const track of result.tracks) {
                await queue.addTrack(track);
            }
            embed
                .setDescription(`キューに**${result.tracks.length}**曲追加されました。`)
                .setThumbnail(result.tracks[0].thumbnail)
                .setFooter({ text: `再生時間: 不明` });
        }
        // サブコマンド 'search'
        else if (interaction.options.getSubcommand() === 'search') {
            const searchterms = interaction.options.getString('searchterms');
            const result = await client.player.search(searchterms!, {
                requestedBy: interaction.user,
                searchEngine: QueryType.AUTO,
            });
            if (result.tracks.length === 0) {
                await interaction.reply({ content: '曲を検索できませんでした', ephemeral: true });
                return;
            }
            const song = result.tracks[0];
            await queue.addTrack(song);
            embed
                .setDescription(`キューへ**[${song.title}](${song.url})** 追加されました。`)
                .setThumbnail(song.thumbnail)
                .setFooter({ text: `再生時間: ${song.duration}` });
        }
        // 再生中でなければ再生開始（引数不要）
        if (!queue.node.isPlaying()) await queue.node.play();
        await interaction.reply({ embeds: [embed] });
    }
};
