import { AudioPlayer, AudioPlayerStatus, createAudioResource, StreamType, VoiceConnection, VoiceConnectionStatus, createAudioPlayer, getVoiceConnection } from "@discordjs/voice";
import * as fs from "fs";
import path from "path";
import os from "os";
import { randomUUID } from "crypto";

export const voiceClients: { [key: string]: VoiceConnection } = {};
export const players: { [key: string]: AudioPlayer } = {};

// プロジェクトルートディレクトリの取得
function getProjectRoot(): string {
        const currentDir = __dirname;
        if (currentDir.includes('build/js/utils') || currentDir.includes('build\\js\\utils')) {
                return path.resolve(path.join(currentDir, '..', '..', '..'));
        } else if (currentDir.includes('/utils') || currentDir.includes('\\utils')) {
                return path.resolve(path.join(currentDir, '..'));
        } else {
                return process.cwd();
        }
}

const PROJECT_ROOT = getProjectRoot();
console.log(`プロジェクトルートディレクトリ: ${PROJECT_ROOT}`);

// AudioPlayerの取得（なければ新規作成）
export function getPlayer(guildId: string): AudioPlayer {
        if (!players[guildId]) {
                players[guildId] = createAudioPlayer();
        }
        return players[guildId];
}

// ボイスクライアント接続状況チェック
export function isVoiceClientConnected(guildId: string): boolean {
        if (!voiceClients[guildId]) {
                return false;
        }
        return voiceClients[guildId].state.status === VoiceConnectionStatus.Ready;
}
