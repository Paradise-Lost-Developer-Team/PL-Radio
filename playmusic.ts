import { CommandInteraction, CommandInteractionOptionResolver, MessageFlags, Events, ChannelType } from "discord.js";
import { joinVoiceChannel, AudioPlayerStatus, createAudioPlayer, createAudioResource, VoiceConnection  } from "@discordjs/voice";
import * as play from "play-dl";
import prism from "prism-media";
import { client } from "./index";

export const player = createAudioPlayer();
export let queue: string[] = [];
export let currentConnection: VoiceConnection | null = null;
export const VolumeTransfromer = new prism.VolumeTransformer({
    volume: 0.5,
    type: 's16le'
});

export function VoiceStateUpdate(connection: VoiceConnection) {
    client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
        if (newState.member?.user.bot) return;
        const voiceChannel = newState.channel ?? oldState.channel;
        if (voiceChannel?.members.size === 0 && voiceChannel.type === ChannelType.GuildVoice) {
          // ボイスチャンネルが空になったときに自動で抜ける
          try {
            const connection = await joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id, 
                adapterCreator: voiceChannel.guild.voiceAdapterCreator as any
            });
            if (connection) {
              setTimeout(() => {
                connection.destroy(); // チャンネルが空であれば退室
              }, 10000); // 10秒後に退室
            }
          } catch (error) {
            console.error('Error joining the voice channel:', error);
          }
        }
      });
}

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
    const stream = await play.stream(url);
    const resource = createAudioResource(stream.stream, { inputType: stream.type });

    currentConnection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator as any
    })

    player.play(resource);
    currentConnection.subscribe(player);

    await interaction.followUp(`🎵 次の音楽を再生中: ${url}`);
    
    player.once(AudioPlayerStatus.Idle, () => {
        queue.shift();
        playNext(interaction, channel);
    });
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
}