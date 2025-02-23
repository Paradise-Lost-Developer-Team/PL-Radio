import { CommandInteraction, CommandInteractionOptionResolver, MessageFlags } from "discord.js";
import { joinVoiceChannel, AudioPlayerStatus, createAudioPlayer, createAudioResource, VoiceConnection } from "@discordjs/voice";
import * as play from "play-dl";

export const player = createAudioPlayer();
export let queue: string[] = [];
export let currentConnection: VoiceConnection | null = null;

export async function playMusic(interaction: CommandInteraction, p0: string) {
    const channel = (interaction.member as any).voice.channel;
    if (!channel) {
        await interaction.reply({ content: "音楽を再生するにはボイスチャンネルに接続する必要があります！", flags: MessageFlags.Ephemeral });
        return;
    }
    const options = interaction.options as CommandInteractionOptionResolver;
    const url = options.getString("url");
    if (!url) {
        await interaction.reply({ content: "再生する音楽のURLを指定してください", flags: MessageFlags.Ephemeral });
        return;
    }

    queue.push(url);
    if (queue.length > 1) {
        await interaction.reply({ content: `次の音楽をキューに追加しました。${url}` });
        return;
    }
    const stream = await play.stream(url);
    const resource = createAudioResource(stream.stream, { inputType: stream.type });
    const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator as any
    });

    player.play(resource);
    connection.subscribe(player);
    await playNext(interaction, channel);
}

export async function stopMusic(interaction: CommandInteraction) {
    if (!currentConnection) {
        await interaction.reply({ content: "現在再生中の音楽がありません", flags: MessageFlags.Ephemeral });
        return;
    }

    currentConnection.destroy();
    player.stop();
    queue.length = 0;
    currentConnection = null;
    await interaction.reply({ content: "音楽を停止しました、そしてキューから全ての音楽を削除しました。", flags: MessageFlags.Ephemeral });
}

async function playNext(interaction: CommandInteraction, channel: any) {
    if (queue.length === 0) return;

    const url = queue[0];

    try {
        console.log('Fetching stream for URL:', url);
        const stream = await play.stream(url);
        console.log('Stream info:', stream);

        const resource = createAudioResource(stream.stream, { inputType: stream.type });
        console.log('AudioResource created:', resource);

        if (!currentConnection || currentConnection.state.status === 'disconnected') {
            console.log('Joining voice channel...');
            currentConnection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator as any,
            });
            console.log('Connected to voice channel:', currentConnection.state.status);
        }

        player.play(resource);
        console.log('Player is playing:', player.state.status);
        currentConnection.subscribe(player);

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(`🎵 次の音楽を再生中: ${url}`);
        } else {
            await interaction.reply(`🎵 次の音楽を再生中: ${url}`);
        }

        player.on('error', (error) => {
            console.error('Player error:', error);
        });

        player.removeAllListeners(AudioPlayerStatus.Idle);
        player.once(AudioPlayerStatus.Idle, async () => {
            console.log('音楽が終了しました、次の曲へ進みます。');
            queue.shift();
            if (queue.length > 0) {
                await playNext(interaction, channel);
            } else {
                await interaction.followUp('✅ キューは空になりました、ボイスチャンネルから切断します。');
                currentConnection?.destroy();
                currentConnection = null;
            }
        });
    } catch (error) {
        console.error('Error playing music:', error);
        await interaction.followUp('❌ エラーが発生しました、音楽の再生を試みます。');
        queue.shift(); // エラーが発生した場合も次の曲へ進める
        if (queue.length > 0) {
            await playNext(interaction, channel);
        } else {
            currentConnection?.destroy();
            currentConnection = null;
        }
    }
}
