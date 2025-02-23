import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { ExtendedClient } from '../../index';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('音楽を一時停止します'),
    execute: async (args: { client: ExtendedClient; interaction: ChatInputCommandInteraction }) => {
        const { client, interaction } = args;
        // interaction.member が確実に存在すると仮定する場合キャスト
        const member = interaction.member as any;
        if (!client.player.queues.has(interaction.guild!.id)) {
            await interaction.reply({ content: '音楽が再生されていません', ephemeral: true });
            return;
        }
        const queue = client.player.queues.get(interaction.guild!.id);
        if (!queue) {
            await interaction.reply({ content: '音楽が再生されていません', ephemeral: true });
            return;
        }
        queue.node.pause();
        const embed = new EmbedBuilder()
            .setTitle('一時停止')
            .setDescription('音楽を一時停止しました');
        await interaction.reply({ embeds: [embed] });
    }
};