import { SlashCommandBuilder } from "@discordjs/builders";
import { EmbedBuilder, MessageFlags, GuildEmoji } from "discord.js";
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
                        .setMinValue(1)
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
    async execute(interaction: any, client: ExtendedClient) {
        await interaction.deferReply();
        // 既に応答済みかチェックしてから deferReply を呼ぶ
        if (!interaction.deferred && !interaction.replied) {

        const { options, member, guild } = interaction;
        const subcommand = options.getSubcommand();
        const query = options.getString("queue");
        const volume = options.getNumber("percentage");
        const option = options.getString("option");
        const voiceChannel = member.voice.channel;

        const embed = new EmbedBuilder();
        
        if (!voiceChannel) {
            embed.setColor("Red").setDescription("ボイスチャンネルに参加してください。");
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
        if (!voiceChannel.joinable) {
            embed.setColor("Red").setDescription("このボイスチャンネルには接続できません。");
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
        if (!member.voice.channelId == guild.members.me.voice.channelId) {
            embed.setColor("Red").setDescription(`音楽システムは既に<#${guild.members.me.voice.channelId}>でアクティブです。`);
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
        
        try {
            switch (subcommand) {
                case "play": {
                    try {
                        await client.distube.play(voiceChannel, query, { textChannel: interaction.channel, member: member });
                        return interaction.editReply({ content: 'リクエストはキューに追加されました。' });
                    } catch (error) {
                        console.error(error);
                        embed.setColor("Red").setDescription("曲再生中に接続エラーが発生しました。");
                        return interaction.editReply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                    }
                }
                case "volume": {
                    // ギルドごとのキューを取得
                    client.distube.setVolume(voiceChannel, volume);
                    return interaction.editReply({ content: `音量を${volume}%に設定しました。` });
                }
                case "options": {
                    // ギルドごとのキューを取得
                    const queue = await client.distube.getQueue(voiceChannel);
                    if (!queue) {
                        embed.setColor("Red").setDescription("キューはアクティブではありません。");
                        return interaction.editReply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                    }
                    // オプション処理はそのままでOK
                    switch (option) {
                        case "skip": {
                            await queue.skip();
                            embed.setColor("Blue").setDescription("⏭️ **トラックがスキップされました**");
                            return interaction.editReply({ embeds: [embed] });
                        }
                        case "stop": {
                            await queue.stop();
                            embed.setColor("Blue").setDescription("⏹️ **トラックが停止されました**");
                            return interaction.editReply({ embeds: [embed] });
                        }
                        case "pause": {
                            await queue.pause();
                            embed.setColor("Blue").setDescription("⏸️ **トラックが一時停止されました**");
                            return interaction.editReply({ embeds: [embed] });
                        }
                        case "resume": {
                            await queue.resume();
                            embed.setColor("Blue").setDescription("▶️ **トラックが再開されました**");
                            return interaction.editReply({ embeds: [embed] });
                        }
                        case "queue": {
                            embed.setColor("Blue").setDescription(`キュー: ${queue.songs.map(
                                (song, id) => `**${id + 1}**. [${song.name}](${song.url}) - \`${song.formattedDuration}\``).join("\n")}`);
                            return interaction.editReply({ embeds: [embed] });
                        }
                        case "loopqueue": {
                            if (queue.repeatMode === 2) {
                                client.distube.setRepeatMode(interaction, 0);
                                embed.setColor("Blue").setDescription(`🔂 **トラックはループされていません:** \`キュー\``);
                            } else {
                                client.distube.setRepeatMode(interaction, 2);
                                embed.setColor("Blue").setDescription(`🔂 **トラックはループされています:** \`キュー\``);
                            }
                            return interaction.editReply({ embeds: [embed] });
                        }
                        case "loopall": {
                            if (queue.repeatMode === 0) {
                                client.distube.setRepeatMode(interaction, 1);
                                embed.setColor("Blue").setDescription(`🔁 **トラックはループされています:** \`全て\``);
                            } else {
                                client.distube.setRepeatMode(interaction, 0);
                                embed.setColor("Blue").setDescription(`🔁 **トラックはループされていません:** \`全て\``);
                            }
                            return interaction.editReply({ embeds: [embed] });
                        }
                        case "autoplay": {
                            if (!queue.autoplay) {
                                client.distube.toggleAutoplay(interaction);
                                embed.setColor("Blue").setDescription(`🔀 **自動再生が有効になりました**`);
                            } else {
                                client.distube.toggleAutoplay(interaction);
                                embed.setColor("Blue").setDescription(`🔀 **自動再生が無効になりました**`);
                            }
                            return interaction.editReply({ embeds: [embed] });
                        }
                        case "shuffle": {
                            await client.distube.shuffle(voiceChannel);
                            embed.setColor("Blue").setDescription(`🔀 **キューはシャッフルされました**`);
                            return interaction.editReply({ embeds: [embed] });
                        }
                        case "filter": {
                            const filters = queue.filters.names;
                            if (filters && filters.length > 0) {
                                embed.setColor("Blue").setDescription(`フィルター: ${filters.join(", ")}`);
                            } else {
                                embed.setColor("Red").setDescription("フィルターが見つかりません。");
                                return interaction.editReply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                            }
                            return interaction.editReply({ embeds: [embed] });
                        }
                        default: {
                            embed.setColor("Red").setDescription("無効なオプションです。");
                            return interaction.editReply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                        }
                    }
                }
                default: {
                    embed.setColor("Red").setDescription("無効なサブコマンドです。");
                    return interaction.editReply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                }
            }
        } catch (error) {
            console.error(error);
            embed.setColor("Red").setDescription("エラーが発生しました。");
            return interaction.editReply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
    }
}};