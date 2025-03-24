import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, MessageFlags } from 'discord.js';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leave')
        .setDescription('BOTをチャンネルから退出します'),
    async execute(interaction: CommandInteraction) {
        const guildId = interaction.guildId!;
        console.log(`Attempting to leave voice channel in guild: ${guildId}`);
        
        // @ts-ignore - DisTubeはクライアントに追加されているはず
        const distube = interaction.client.distube;
        
        if (!distube) {
            console.error('DisTube not found on client');
            await interaction.reply({ content: "音声システムの初期化に失敗しました。", flags: MessageFlags.Ephemeral });
            return;
        }

        try {
            // ボットがボイスチャンネルにいるか確認
            const voiceConnection = distube.voices.get(guildId);
            
            if (!voiceConnection) {
                await interaction.reply({ content: "現在、ボイスチャンネルに接続していません。", flags: MessageFlags.Ephemeral });
                return;
            }

            // DisTubeを使用してボイスチャンネルから退出
            await distube.voices.leave(guildId);
            console.log('Successfully left voice channel using DisTube');
            await interaction.reply("ボイスチャンネルから切断しました。");
        } catch (error) {
            console.error('ボイスチャンネルの切断に失敗しました:', error);
            await interaction.reply({ content: "ボイスチャンネルからの切断に失敗しました。", flags: MessageFlags.Ephemeral });
        }
    }
}