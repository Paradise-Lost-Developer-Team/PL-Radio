import { SlashCommandBuilder } from "@discordjs/builders";
import { EmbedBuilder, VoiceChannel, MessageFlags, TextChannel } from "discord.js";
import { ExtendedClient } from "../../index";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("music")
        .setDescription("音楽コマンド")
        .addSubcommand(subcommand =>
            subcommand
                .setName("play")
                .setDescription("音楽を再生します")
                .addStringOption(option =>
                    option
                        .setName("query")
                        .setDescription("曲の名前またはURLを指定してください。")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("volume")
                .setDescription("音量を設定します")
                .addNumberOption(option =>
                    option
                        .setName("percentage")
                        .setDescription("音量をパーセンテージで指定してください。: 10 = 10%")
                        .setMinValue(0)
                        .setMaxValue(100)
                        .setRequired(true)
                )
            )
            .addSubcommand(subcommand =>
            subcommand
                .setName("options")
                .setDescription("音楽のオプションを設定します")
                .addStringOption(option =>
                    option
                        .setName("option")
                        .setDescription("オプションを選択してください")
                        .setRequired(true)
                        .addChoices(
                            { name: "スキップ", value: "skip" },
                            { name: "停止", value: "stop" },
                            { name: "一時停止", value: "pause" },
                            { name: "再開", value: "resume" },
                            { name: "キュー", value: "queue" },
                            { name: "ループトラック", value: "loopqueue" },
                            { name: "ループ", value: "loopall" },
                            { name: "自動再生", value: "autoplay" },
                            { name: "シャッフル", value: "shuffle" },
                            { name: "フィルタ", value: "filter" }
                        )
                    )
                ),
    async execute(interaction: any) {
        // deferReply により応答期限切れを防止
        await interaction.deferReply({  });

        const { options, member, guild } = interaction;
        // 明示的にテキストチャンネルを fetch して取得
        const fetchedChannel = await guild.channels.fetch(interaction.channel.id) as TextChannel;
        const subcommand = options.getSubcommand();
        const query = options.getString("query");
        const volume = options.getNumber("percentage");
        const option = options.getString("option");
        const voiceChannel = member.voice.channel as VoiceChannel;
        const client = interaction.client as ExtendedClient;

        const embed = new EmbedBuilder();

        if (!voiceChannel) {
            embed.setColor("Red").setDescription("ボイスチャンネルに参加してください。");
            return interaction.editReply({ embeds: [embed] });
        }

        // すでに接続済みの場合のチェック
        if (guild.members.me.voice.channelId && guild.members.me.voice.channelId !== member.voice.channelId) {
            embed.setColor("Red").setDescription(`音楽システムは既に<#${guild.members.me.voice.channelId}>でアクティブです。`);
            return interaction.editReply({ embeds: [embed] });
        }

        try {
            switch (subcommand) {
                case "play":
                    const queue = await client.distube.getQueue(voiceChannel);
                    // 明示的に fetchedChannel を渡す
                    client.distube.play(voiceChannel, query, { textChannel: fetchedChannel, member });
                    await interaction.editReply({ content: 'リクエストはキューに追加されました。' });
                    break;
                case "volume":
                    if (!queue) {
                        embed.setColor("Red").setDescription("キューは既に空です。");
                        return interaction.editReply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                    }
                    client.distube.setVolume(voiceChannel, volume);
                    await interaction.editReply({ content: `音量を${volume}%に設定しました。` });
                    break;
                case "options":
                    switch (option) {
                        case "skip":
                            if (!queue) {
                                embed.setColor("Red").setDescription("キューは既に空です。");
                                return interaction.editReply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                            }
                            await queue.skip();
                            embed.setColor("Blue").setDescription("⏭️ **トラックがスキップされました**");
                            return interaction.editReply({ embeds: [embed] });
                        case "stop":
                            if (!queue) {
                                embed.setColor("Red").setDescription("キューは既に空です。");
                                return interaction.editReply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                            }
                            await queue.stop();
                            embed.setColor("Blue").setDescription("⏹️ **トラックが停止されました**");
                            return interaction.editReply({ embeds: [embed] });
                        case "resume":
                            if (!queue) {
                                embed.setColor("Red").setDescription("キューは既に空です。");
                                return interaction.editReply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                            }
                            await queue.resume();
                            embed.setColor("Blue").setDescription("▶️ **トラックが再開されました**");
                            return interaction.editReply({ embeds: [embed] });
                        case "queue":
                            if (!queue) {
                                embed.setColor("Red").setDescription("キューは既に空です。");
                                return interaction.editReply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                            }
                            embed.setColor("Blue").setDescription(`キュー: ${queue.songs.map((song, id) => `**${id + 1}**. [${song.name}](${song.url}) - \`${song.formattedDuration}\``).join("\n")}`);
                            return interaction.editReply({ embeds: [embed] });
                        case "loopqueue":
                            if (!queue) {
                                embed.setColor("Red").setDescription("キューは既に空です。");
                                return interaction.editReply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                            }
                            if (queue.repeatMode === 2) {
                                await client.distube.setRepeatMode(interaction, 0);
                                embed.setColor("Blue").setDescription(`🔂 **トラックはループされていません:** \`キュー\``);
                                return interaction.editReply({ embeds: [embed] });
                            } else {
                                await client.distube.setRepeatMode(interaction, 2);
                                embed.setColor("Blue").setDescription(`🔂 **トラックはループされています:** \`キュー\``);
                                return interaction.editReply({ embeds: [embed] });
                            }
                        case "loopall":
                            if (!queue) {
                                embed.setColor("Red").setDescription("キューは既に空です。");
                                return interaction.editReply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                            }
                            if (queue.repeatMode === 0) {
                                await client.distube.setRepeatMode(interaction, 1);
                                embed.setColor("Blue").setDescription(`🔁 **トラックはループされています:** \`全て\``);
                                return interaction.editReply({ embeds: [embed] });
                            } else {
                                await client.distube.setRepeatMode(interaction, 0);
                                embed.setColor("Blue").setDescription(`🔁 **トラックはループされていません:** \`全て\``);
                                return interaction.editReply({ embeds: [embed] });
                            }
                        case "autoplay":
                            if (!queue) {
                                embed.setColor("Red").setDescription("キューは既に空です。");
                                return interaction.editReply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                            }
                            if (!queue.autoplay) {
                                await client.distube.toggleAutoplay(interaction);
                                embed.setColor("Blue").setDescription(`🔀 **自動再生が有効になりました**`);
                                return interaction.editReply({ embeds: [embed] });
                            } else {
                                await client.distube.toggleAutoplay(interaction);
                                embed.setColor("Blue").setDescription(`🔀 **自動再生が無効になりました**`);
                                return interaction.editReply({ embeds: [embed] });
                            }
                        case "shuffle":
                            await client.distube.shuffle(voiceChannel);
                            embed.setColor("Blue").setDescription(`🔀 **キューはシャッフルされました**`);
                            return interaction.editReply({ embeds: [embed] });
                        case "filter":
                            if (!queue) {
                                embed.setColor("Red").setDescription("キューは既に空です。");
                                return interaction.editReply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                            }
                            const filters = queue.filters.names;
                            if (filters && filters.length > 0) {
                                embed.setColor("Blue").setDescription(`フィルター: ${filters.join(", ")}`);
                                return interaction.editReply({ embeds: [embed] });
                            } else {
                                embed.setColor("Red").setDescription("フィルターが見つかりません。");
                                return interaction.editReply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                            }
                    }
            }

        } catch (error) {
            console.error(error);
            embed.setColor("Red").setDescription("エラーが発生しました。");
            return interaction.editReply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
    }
}

process.on('uncaughtException', (err) => {
    console.error("予期しないエラーが発生しました。", err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error("Promiseが拒否されました。", reason);
});
