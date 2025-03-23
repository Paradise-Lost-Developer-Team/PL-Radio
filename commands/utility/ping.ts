import { SlashCommandBuilder } from '@discordjs/builders';
import { EmbedBuilder, CommandInteraction } from 'discord.js';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('BOTの応答時間をテストします。'),
    async execute(interaction: CommandInteraction) {
        const client = interaction.client;
        const botLatency = Math.round(client.ws.ping);
        
        // レスポンスを送信前に「測定中...」と表示
        await interaction.deferReply();
        
        const embed = new EmbedBuilder()
            .setTitle("Latency")
            .setColor("#00dd00")
            .addFields(
                { name: "Bot Latency", value: `${botLatency}ms`, inline: true },
            )
            .setDescription(`Pong！レイテンシー測定結果です。`);
            
        await interaction.editReply({ embeds: [embed] });
    }
};