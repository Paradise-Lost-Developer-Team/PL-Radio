import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed } from 'discord.js';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('音楽を一時停止します'),
    execute: async ({client, interaction}) => {

        const queue = client.player.getQueue(interaction.guildId);

        if (!queue) {
            await interaction.reply({ content: '音楽が再生されていません', flags: MessageFlags.Ephemeral });
            return;
        }

        queue.setPaused(true);

        await interaction.reply("音楽を一時停止しました。");
    }
}