import { Client, CommandInteraction, GuildMember } from 'discord.js';
import { getVoiceConnection } from '@discordjs/voice';

const stopCommand = {
    name: 'stop',
    description: 'ボイスチャンネルから切断するコマンドです',
    run: async (client: Client, interaction: CommandInteraction) => {
        if (!interaction.guild) {
            return interaction.reply('このコマンドはサーバー内でのみ使用できます。');
        }

        const member = interaction.member as GuildMember;
        if (!member.voice.channel) {
            return interaction.reply('まず、ボイスチャンネルに参加してください。');
        }

        const connection = getVoiceConnection(interaction.guild.id);
        if (!connection) {
            return interaction.reply('現在、ボイスチャンネルに接続していません。');
        }

        connection.destroy();
        return interaction.reply('ボイスチャンネルから切断しました。');
    }
};

export default stopCommand;