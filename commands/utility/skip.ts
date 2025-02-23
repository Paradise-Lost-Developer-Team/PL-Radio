import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import { ExtendedClient } from '../../index';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('現在の曲をスキップします'),
    execute: async (args: { client: ExtendedClient; interaction: ChatInputCommandInteraction }) => {
        const { client, interaction } = args;
        const queue = client.player.queues.get(interaction.guildId!);
        if (!queue) {
            await interaction.reply({ content: '音楽が再生されていません', flags: MessageFlags.Ephemeral });
            return;
        }
        // 現在の曲は currentTrack に変更
        const currentSong = queue.currentTrack;
        // スキップは node.skip() を使用
        queue.node.skip();
        const embed = new EmbedBuilder()
            .setTitle('スキップ')
            .setDescription(`曲をスキップしました。 Now playing: ${currentSong ? currentSong.title : "なし"}`);
        await interaction.reply({ embeds: [embed] });
    }
};