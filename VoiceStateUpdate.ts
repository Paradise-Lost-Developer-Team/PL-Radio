import { Events } from 'discord.js';
import { VoiceConnection, VoiceConnectionStatus } from '@discordjs/voice';
import { ExtendedClient } from './index';
// 代替手段として、voiceClients を VoiceEngine.ts などからインポート

export const voiceClients: Record<string, VoiceConnection> = {};

export function VoiceStateUpdate(client: ExtendedClient) {
    client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
        // 少し待ってから最新状態を取得
        setTimeout(async () => {
            // 改めてボイスチャンネルを取得（新状態で再取得）
            const channel = oldState.channel ?? newState.channel;
            if (!channel) return;
            // 最新状態に基づいて非Botメンバー数をカウント
            const nonBotCount = channel.members.filter(member => !member.user.bot).size;
            if (nonBotCount === 0) {
                const guildId = channel.guild.id;
                const voiceClient = voiceClients[guildId];
                if (voiceClient && voiceClient.state.status === VoiceConnectionStatus.Ready) {
                    console.log(`Guild ${guildId}: Botのみ残っているため退室します。`);
                    voiceClient.disconnect();
                    delete voiceClients[guildId];
                }
            }
        }, 2000); // 2秒待機
    });
}