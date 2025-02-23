import { SlashCommandBuilder } from '@discordjs/builders';
import { EmbedBuilder, CommandInteraction, MessageFlags } from 'discord.js';
import { client } from '../../index';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('BOTの応答時間をテストします。'),
    async execute(interaction: CommandInteraction) {
        // Math.maxを使用して、負の値を回避
        const latency = Math.max(0, Math.round(client.ws.ping));
        const embed = new EmbedBuilder()
            .setTitle("Latency")
            .setColor("#00ff00")
            .setDescription(`Pong！BotのPing値は${latency}msです。`);
        await interaction.reply({ embeds: [embed] });
    }
};