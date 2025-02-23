import { SlashCommandBuilder } from "@discordjs/builders";
import { QueryType, SearchResult, Player, PlayerNodeInitializerOptions } from "discord-player";
import { Client, ChatInputCommandInteraction, MessageFlags, GuildMember, TextBasedChannel } from "discord.js";
import { client } from "../../index";

const player = new Player(client, {});

module.exports = {
    data: new SlashCommandBuilder()
      .setName("play")
      .setDescription("音楽を再生します"),
    async execute(client: Client, interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            return await interaction.reply({
                content: "このコマンドはサーバー内でのみ使用できます",
                flags: MessageFlags.Ephemeral,
            });
        }
    
        if (interaction.member) {
            const member = await interaction.guild.members.fetch(interaction.member.user.id);
            // ... rest of your code
        } else {
            // handle the case where interaction.member is null
            console.error("interaction.member is null");
            return await interaction.reply({
                content: "エラーが発生しました",
                flags: MessageFlags.Ephemeral,
            });
        }

        // キューを生成
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

        let member: GuildMember | null = null;

        if (interaction.member) {
            member = await interaction.guild.members.fetch(interaction.member.user.id);
        } else {
            console.error("interaction.member is null");
            return await interaction.reply({
                content: "エラーが発生しました",
                flags: MessageFlags.Ephemeral,
            });
        }

        if (client.user && interaction.guild.members.cache.get(client.user.id)?.voice?.channelId && member instanceof GuildMember && member.voice.channelId !== interaction.guild.members.cache.get(client.user.id)?.voice?.channelId) {
            return await interaction.reply({
                content: "botと同じボイスチャンネルに参加してください",
                flags: MessageFlags.Ephemeral,
            });
        }
        
        if (member instanceof GuildMember && !member.voice.channelId) {
            return await interaction.reply({
                content: "ボイスチャンネルに参加してください",
                flags: MessageFlags.Ephemeral,
            });
        }
        
        if (interaction.member instanceof GuildMember && interaction.member.voice.channel) {
            await queue.connect(interaction.member.voice.channel);
        } else {
            (queue as unknown as Player).destroy();
            return await interaction.reply({
                content: "ボイスチャンネルに参加できませんでした",
                flags: MessageFlags.Ephemeral,
            });
        }

    await interaction.deferReply();

    const url = interaction.options.getString("https://www.youtube.com/live/jfKfPfyJRdk");
    // 入力されたURLからトラックを取得
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
