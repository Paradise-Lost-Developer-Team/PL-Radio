import { Events } from 'discord.js';
import { VoiceConnectionStatus, getVoiceConnection } from '@discordjs/voice';
import { ExtendedClient } from '../index';

export function VoiceStateUpdate(client: ExtendedClient) {
    client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
        // ボットの移動は無視する（ボットの状態変更に反応して退室させないため）
        if (oldState.member?.user.bot || newState.member?.user.bot) return;
        
        // 少し待ってから最新状態を取得
        setTimeout(async () => {
            // ギルドIDを取得
            const guildId = oldState.guild.id;
            
            // このギルドにボットが接続しているか確認
            const voiceConnection = getVoiceConnection(guildId);
            if (!voiceConnection) return;
            
            // ボットが接続しているチャンネルを取得
            const botChannel = oldState.guild.members.me?.voice.channel;
            if (!botChannel) return;
            
            // ボットのいるチャンネル内の非Botメンバー数をカウント
            const nonBotCount = botChannel.members.filter(member => !member.user.bot).size;
            
            if (nonBotCount === 0) {
                if (voiceConnection.state.status === VoiceConnectionStatus.Ready) {
                    console.log(`Guild ${guildId}: ボットのみ残っているため退室します。`);
                    voiceConnection.disconnect();
                }
            }
        }, 3000); // 3秒待機に延長（状態更新が完全に反映される時間を確保）
    });
}