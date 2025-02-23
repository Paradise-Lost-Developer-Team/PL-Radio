import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import { ExtendedClient } from '../../index';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('再生を再開します'),
    execute: async (args: { client: ExtendedClient; interaction: ChatInputCommandInteraction }) => {
        const { client, interaction } = args;
        const queue = client.player.queues.get(interaction.guildId!);
        if (!queue) {
            await interaction.reply({ content: '音楽が再生されていません', flags: MessageFlags.Ephemeral });
            return;
        }
        // 再生再開は play() を呼び出す（再生中でなければ再開される）
        if (!queue.node.isPlaying()) await queue.node.play();
        const embed = new EmbedBuilder()
            .setTitle('再生再開')
            .setDescription('音楽の再生を再開しました');
        await interaction.reply({ embeds: [embed] });
    }
};