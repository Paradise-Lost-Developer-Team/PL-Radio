import { SlashCommandBuilder } from '@discordjs/builders';
import { EmbedBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { ExtendedClient } from '../../index';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('現在のキューを表示します'),
    execute: async (args: { client: ExtendedClient; interaction: ChatInputCommandInteraction }) => {
        const { client, interaction } = args;
        // queues.get を使用
        const queue = client.player.queues.get(interaction.guildId!);
        if (!queue) {
            await interaction.reply({ content: '音楽が再生されていません', flags: MessageFlags.Ephemeral });
            return;
        }
        // queue.tracks が配列でない場合、 Array.from() を利用
        const tracksArray = Array.from((queue.tracks as any).values()); // 変更: .values() を利用
        // map の引数に型注釈を追加
        const queueString = tracksArray.slice(0, 10).map((song: any, i: number) => {
            return `${i + 1}. ${song.title}`;
        }).join("\n") || 'キューは空です';
        const embed = new EmbedBuilder()
            .setTitle('キュー')
            .setDescription(queueString);
        await interaction.reply({ embeds: [embed] });
    }
};