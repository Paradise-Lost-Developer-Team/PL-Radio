import { SlashCommandBuilder } from "@discordjs/builders";
import { QueryType, SearchResult, Player, PlayerNodeInitializerOptions } from "discord-player";
import { Client, ChatInputCommandInteraction, MessageFlags, GuildMember, TextBasedChannel } from "discord.js";
import { client } from "../../index";

const player = new Player(client, {});

module.exports = {
    data: new SlashCommandBuilder()
      .setName("lofi")
      .setDescription("Lo-Fi音楽を再生します"),
    async execute(client: Client, interaction: ChatInputCommandInteraction) {
        // guildが存在しない場合はサーバー外でコマンドが実行されていると考え、エラーメッセージを返す
        if (!interaction.guild) {
            return await interaction.reply({
                content: "このコマンドはサーバー内でのみ使用できます",
                flags: MessageFlags.Ephemeral,
            });
        }

        let member: GuildMember | null = null;

        // interaction.memberが存在するか確認
        if (interaction.member) {
            member = await interaction.guild.members.fetch(interaction.member.user.id);
        } else {
            console.error("interaction.member is null");
            return await interaction.reply({
                content: "エラーが発生しました",
                flags: MessageFlags.Ephemeral,
            });
        }

        // ボイスチャンネルに参加しているか確認
        if (!member.voice.channelId) {
            return await interaction.reply({
                content: "ボイスチャンネルに参加してください",
                flags: MessageFlags.Ephemeral,
            });
        }

        // 音楽再生用のキューを作成
        const queue = player.queues.create(interaction.guild.id, {
            metadata: {
                channel: interaction.channel,
            },
        });

        if (!queue) {
            return await interaction.reply({
                content: "音楽が再生されていません",
                flags: MessageFlags.Ephemeral,
            });
        }

        // botが既にボイスチャンネルにいる場合、ユーザーと同じチャンネルに参加するかを確認
        if (client.user && interaction.guild.members.cache.get(client.user.id)?.voice?.channelId && member instanceof GuildMember && member.voice.channelId !== interaction.guild.members.cache.get(client.user.id)?.voice?.channelId) {
            return await interaction.reply({
                content: "botと同じボイスチャンネルに参加してください",
                flags: MessageFlags.Ephemeral,
            });
        }

        // member.voice.channelがnullでないことを確認
        if (member.voice.channel) {
            await queue.connect(member.voice.channel);
        } else {
            return await interaction.reply({
                content: "ボイスチャンネルに接続できませんでした",
                flags: MessageFlags.Ephemeral,
            });
        }

        await interaction.deferReply();

        // 固定URLから動画を取得
        const url = "https://www.youtube.com/live/jfKfPfyJRdk";

        const track = await (client as any).player
        .search(url, {
            requestedBy: interaction.user,
            searchEngine: QueryType.YOUTUBE_VIDEO,
        })
        .then((x: SearchResult) => {
            const track = x.tracks[0];
            return track;
        });

        if (!track) {
            return await interaction.followUp({
                content: "動画が見つかりませんでした",
            });
        }

        // キューにトラックを追加
        await queue.addTrack(track);

        if (interaction.channel) {
            const playOptions: PlayerNodeInitializerOptions<{ channel: TextBasedChannel | null; }> = {
                nodeOptions: {},
            };

            queue.play(track, playOptions);
        }
    },
};