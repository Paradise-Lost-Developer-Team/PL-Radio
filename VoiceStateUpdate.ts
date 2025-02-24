import { Client, Events } from 'discord.js';
import { VoiceConnection, VoiceConnectionStatus } from '@discordjs/voice';

const voiceClients: { [key: string]: VoiceConnection } = {};

interface ExtendedClient extends Client {
    // Add any additional properties or methods here if needed
}

export function VoiceStateUpdate(client: ExtendedClient) {
    client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
        const member = newState.member!;
        const guildId = member.guild.id;
        const voiceClient = voiceClients[guildId];

        if (member.user.bot) return;

        if (voiceClient && voiceClient.state.status === VoiceConnectionStatus.Ready) {
            if (oldState.channel && !newState.channel) {
                // ユーザーがボイスチャンネルから退出したとき
                if (voiceClient.joinConfig.channelId === oldState.channel.id) {
                    // ボイスチャンネルに誰もいなくなったら退室
                    if (oldState.channel.members.filter(member => !member.user.bot).size === 0) {  // ボイスチャンネルにいるのがBOTだけの場合
                        voiceClient.disconnect();
                        delete voiceClients[guildId];
                    }
                }
            }
        }
    });
}