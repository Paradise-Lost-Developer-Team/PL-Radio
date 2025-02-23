import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed } from 'discord.js';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('音楽のキューを表示します'),
    execute: async ({client, interaction}) => {

        const queue = client.player.getQueue(interaction.guildId);

        if (!queue || !queue.playing) {
            await interaction.reply({ content: '音楽が再生されていません', flags: MessageFlags.Ephemeral });
            return;
        }

        const queueString = queue.tracks.slice(0, 10).map((song, i) => {
            return `${i + 1}) [${song.duration}]\` ${song.title} - <@${song.requestedBy.id}>`;
        }).join('\n');

        const currentSong = queue.current;

        await interaction.reply({
            embeds: [
                new MessageEmbed()
                    .setDescription(`**現在再生中:**\n\`${currentSong.title} - <@${currentSong.requestedBy.id}>\n\n**キュー:**\n${queueString}`)
                    .setThumbnail(currentSong.thumbnail)
            ]
        })
    }
}