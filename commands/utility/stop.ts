import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import { ExtendedClient } from '../../index';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('音楽を停止します'),
    execute: async (args: { client: ExtendedClient; interaction: ChatInputCommandInteraction }) => {
        const { client, interaction } = args;
        const queue = client.player.queues.get(interaction.guildId!);
        if (!queue) {
            await interaction.reply({ content: '音楽が再生されていません', flags: MessageFlags.Ephemeral });
            return;
        }
        queue.delete(); // delete() を使用してキューを削除
        const embed = new EmbedBuilder()
            .setTitle('停止')
            .setDescription('音楽の再生を停止しました');
        await interaction.reply({ embeds: [embed] });
    }
};