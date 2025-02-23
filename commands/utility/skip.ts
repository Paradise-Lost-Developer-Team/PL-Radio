import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed, MessageFlags } from 'discord.js';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('次の曲を再生します'),
    execute: async ({client, interaction}) => {

        const queue = client.player.getQueue(interaction.guildId);

        if (!queue) {
            await interaction.reply({ content: '音楽が再生されていません', flags: MessageFlags.Ephemeral });
            return;
        }

        const currentSong = queue.current;

        queue.skip();

        await interaction.reply({ 
            embeds: [
                new MessageEmbed()
                .setDescription(`[${currentSong.title}](${currentSong.url}) をスキップしました`)
                .setThumbnail(currentSong.thumbnail)
            ] 
        });
    }
}