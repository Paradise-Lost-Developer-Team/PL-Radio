import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed, MessageFlags } from 'discord.js';
import { QueryType } from 'discord-player';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('音楽を再生します')
        .addSubcommand(Subcommand => {
            Subcommand
                .setName('search')
                .setDescription('音楽を検索して再生します')
                .addStringOption(option => {
                    option
                        .setName('searchterms')
                        .setDescription('検索キーワード')
                        .setRequired(true);
                })
        })
        .addSubcommand(Subcommand => {
            Subcommand
                .setName('playlist')
                .setDescription('プレイリストから再生します')
                .addStringOption(option => {
                    option
                        .setName('url')
                        .setDescription('再生するプレイリストのURL')
                        .setRequired(true);
                })
        })
        .addSubcommand(Subcommand => {
            Subcommand
                .setName('song')
                .setDescription('曲を再生します')
                .addStringOption(option => {
                    option
                        .setName('url')
                        .setDescription('再生する曲のURL')
                        .setRequired(true);
                })
        }),
    execute: async ({client, interaction}) => {
        if (!interaction.member.voice.channel) {
            await interaction.reply({ content: 'ボイスチャンネルに接続してください。', flags: MessageFlags.Ephemeral });
            return;
        }
            
        const queue = await client.player.createQueue(interaction.guild)

        if (!queue.connection) await queue.connect(interaction.member.voice.channel)
            
        let embed = new MessageEmbed()
        if(interaction.options.getSubcommand() === 'song') {

            let url = interaction.options.getString('url');

            const result = await client.player.search(url, {
                requestedBy: interaction.user,
                searchEngine: QueryType.YOUTUBE_VIDEO
            });

            if (result.tracks.length === 0) {
                await interaction.reply({ content: '曲を検索できませんでした', flags: MessageFlags.Ephemeral });
                return
            }

            const song = result.tracks[0]
            await queue.addTrack(song);

            embed
                .setDescription(`キューへ**[${song.title}](${song.url}** 追加されました。`))
                .setThumbnail(song.thumbnail)
                .setFooter({ text: `再生時間: ${song.duration}` })
        } else if (interaction.options.getSubcommand() === 'playlist') {
                
            let url = interaction.options.getString('url');

            const result = await client.player.search(url, {
                requestedBy: interaction.user,
                searchEngine: QueryType.YOUTUBE_PLAYLIST
            });

            if (result.tracks.length === 0) {
                await interaction.reply({ content: 'プレイリストを検索できませんでした', flags: MessageFlags.Ephemeral });
                return
            }

            const playlist = result.playlist;
            await queue.addTracks(playlist);

            embed
                .setDescription(`キューに**${result.tracks.length}**曲追加されました。`)
                .setThumbnail(result.tracks[0].thumbnail)
                .setFooter({ text: `再生時間: ${playlist.duration}` })
        } else if (interaction.options.getSubcommand() === 'search') {

            let url = interaction.options.getString('searchterms');

            const result = await client.player.search(url, {
                requestedBy: interaction.user,
                searchEngine: QueryType.AUTO,
            });
            if (result.tracks.length === 0) {
                await interaction.reply({ content: '曲を検索できませんでした', flags: MessageFlags.Ephemeral });
                return
            }
                
            const song = result.tracks[0]
            await queue.addTracks(song);

            embed
                .setDescription(`キューへ**[${song.title}](${song.url}** 追加されました。`)
                .setThumbnail(song.thumbnail)
                .setFooter({ text: `再生時間: ${song.duration}` })
        }
        
        if (!queue.playing) await queue.play();
           await interaction.reply({ 
            embeds: [embed] 
        });
    }
}
