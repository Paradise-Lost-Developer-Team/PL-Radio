import { Client, Events } from 'discord.js';
import { VoiceConnection, VoiceConnectionStatus } from '@discordjs/voice';
// 代替手段として、voiceClients を VoiceEngine.ts などからインポート

const voiceClients: { [key: string]: VoiceConnection } = {};

export function VoiceStateUpdate(client: Client) {
    client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
        const channel = oldState.channel ?? newState.channel;
        if (channel && channel.members.filter(member => !member.user.bot).size === 0) {
            const guildId = channel.guild.id;
            const voiceClient = voiceClients[guildId];
            if (voiceClient && voiceClient.state.status === VoiceConnectionStatus.Ready) {
                console.log(`Guild ${guildId}: Bot only remains in channel, disconnecting.`);
                voiceClient.disconnect();
                delete voiceClients[guildId];
            }
        }
    });
}