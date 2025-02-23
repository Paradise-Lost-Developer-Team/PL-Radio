import { CommandInteraction, MessageFlags } from "discord.js";
import { joinVoiceChannel, VoiceConnection, createAudioResource } from "@discordjs/voice";
import * as play from "play-dl";
import { player, headers, fetchVideoInfo } from "./playmusic";

const lofiUrl = 'https://www.youtube.com/watch?v=jfKfPfyJRdk';

headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36';

fetchVideoInfo(lofiUrl)

let currentConnection: VoiceConnection | null = null;

export async function playLofi(interaction: CommandInteraction) {
    const channel = (interaction.member as any).voice.channel;
    if (!channel) {
        await interaction.reply({ content: "Lo-Fi音楽を再生するにはボイスチャンネルに接続する必要があります", flags: MessageFlags.Ephemeral });
        return;
    }
    const stream = await play.stream(lofiUrl);
    const resource = createAudioResource(stream.stream, { inputType: stream.type });
    const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator as any
    });

    currentConnection = connection;
    player.play(resource);
    connection.subscribe(player);

    await interaction.reply({ content: `Lo-Fi Girl ライブストリームを再生中`, components: [] });
}

export async function stopLofi(interaction: CommandInteraction) {
    if (currentConnection) {
        currentConnection.destroy();
    }
    player.stop();
    currentConnection = null;
    await interaction.reply({ content: "Lo-Fi Girl ライブストリームを停止しました", flags: MessageFlags.Ephemeral });
}