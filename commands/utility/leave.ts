import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, MessageFlags } from 'discord.js';
import { getVoiceConnection } from '@discordjs/voice';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leave')
        .setDescription('BOTをチャンネルから退出します'),
    async execute(interaction: CommandInteraction) {
        const guildId = interaction.guildId!;
        const connection = getVoiceConnection(guildId);

        if (!connection) {
            await interaction.reply({ content: "現在、ボイスチャンネルに接続していません。", flags: MessageFlags.Ephemeral });
            return;
        }

        try {
            connection.disconnect();
            await interaction.reply("ボイスチャンネルから切断しました。");
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: "ボイスチャンネルからの切断に失敗しました。", flags: MessageFlags.Ephemeral });
        }
    }
}