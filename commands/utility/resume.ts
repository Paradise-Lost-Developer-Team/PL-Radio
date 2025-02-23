import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed } from 'discord.js';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('音楽を再開します'),
    execute: async ({client, interaction}) => {

        const queue = client.player.getQueue(interaction.guildId);

        if (!queue) {
            await interaction.reply({ content: '音楽が再生されていません', flags: MessageFlags.Ephemeral });
            return;
        }

        queue.setPaused(false);

        await interaction.reply("音楽を再開しました。");
    }
}