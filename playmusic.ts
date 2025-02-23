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

    await interaction.reply({ content: `音楽を再生中: ${url}`, components: [] });
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
        adapterCreator: channel.guild.voiceAdapterCreator as any,
    });

    player.play(resource);
    currentConnection.subscribe(player);

    player.once(AudioPlayerStatus.Idle, async () => {
        queue.shift();
        if (queue.length > 0) {
            await playNext(interaction, channel);
        } else {
            await interaction.followUp('キューは空になりました、再生を終了します。');
            currentConnection?.destroy();
            currentConnection = null;
        }
    });
}