import { SlashCommandBuilder } from "@discordjs/builders";
import { EmbedBuilder, PermissionFlagsBits, GuildEmoji, VoiceChannel, MessageFlags } from "discord.js";
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
        const { options, member, guild, channel } = interaction;

        const subcommand = options.getSubcommand();
        const query = options.getString("query");
        const volume = options.getNumber("percentage");
        const option = options.getString("option");
        const voiceChannel = member.voice.channel as VoiceChannel;
        const client = interaction.client as ExtendedClient;

        const embed = new EmbedBuilder();

        if (!voiceChannel) {
            embed.setColor("Red").setDescription("ボイスチャンネルに参加してください。");
            return interaction.reply({ embeds: [embed] });
        }
            
        if (!member.voice.channelId == guild.members.me.voice.channelId) {
            embed.setColor("Red").setDescription(`音楽システムは既に<#${guild.members.me.voice.channelId}>でアクティブなので使用できません。`);
            return interaction.reply({ embeds: [embed] });
        }
        
        try {

            switch (subcommand) {
                case "play":
                    client.distube.play(voiceChannel, query, { textChannel: channel, member: member });
                    return interaction.reply({ content: 'リクエストはキューに追加されました。' });
                case "volume":
                    client.distube.setVolume(voiceChannel, volume);
                    return interaction.reply({ content: `音量を${volume}%に設定しました。` });
                case "options":
                    const queue = await client.distube.getQueue(voiceChannel);

                    if (!queue) {
                        embed.setColor("Red").setDescription("キューが見つかりません。");
                        return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                    }

                    switch (option) {
                        case "skip":
                            await queue.skip();
                            embed.setColor("Blue").setDescription("⏭️ **トラックがスキップされました**");
                            return interaction.reply({ embeds: [embed] });
                        case "stop":
                            await queue.stop();
                            embed.setColor("Blue").setDescription("⏹️ **トラックが停止されました**");
                            return interaction.reply({ embeds: [embed] });
                        case "pause":
                            await queue.pause();
                            embed.setColor("Blue").setDescription("⏸️ **トラックが一時停止されました**");
                            return interaction.reply({ embeds: [embed] });
                        case "resume":
                            await queue.resume();
                            embed.setColor("Blue").setDescription("▶️ **トラックが再開されました**");
                            return interaction.reply({ embeds: [embed] });
                        case "queue":
                            embed.setColor("Blue").setDescription(`キュー: ${queue.songs.map((song, id) => `**${id + 1}**. [${song.name}](${song.url}) - \`${song.formattedDuration}\``).join("\n")}`);
                            return interaction.reply({ embeds: [embed] });
                        case "loopqueue":
                            if (queue.repeatMode === 2) {
                                await client.distube.setRepeatMode(interaction, 0);
                                embed.setColor("Blue").setDescription(`🔂 **トラックはループされていません:** \`キュー\``);
                                return interaction.reply({ embeds: [embed] });
                            } else {
                                await client.distube.setRepeatMode(interaction, 2);
                                embed.setColor("Blue").setDescription(`🔂 **トラックはループされています:** \`キュー\``);
                                return interaction.reply({ embeds: [embed] });
                            }
                        case "loopall":
                            if (queue.repeatMode === 0) {
                                await client.distube.setRepeatMode(interaction, 1);
                                embed.setColor("Blue").setDescription(`🔁 **トラックはループされています:** \`全て\``);
                                return interaction.reply({ embeds: [embed] });
                            } else {
                                await client.distube.setRepeatMode(interaction, 0);
                                embed.setColor("Blue").setDescription(`🔁 **トラックはループされていません:** \`全て\``);
                                return interaction.reply({ embeds: [embed] });
                            }
                        case "autoplay":
                            if (!queue.autoplay) {
                                await client.distube.toggleAutoplay(interaction);
                                embed.setColor("Blue").setDescription(`🔀 **自動再生が有効になりました**`);
                                return interaction.reply({ embeds: [embed] });
                            } else {
                                await client.distube.toggleAutoplay(interaction);
                                embed.setColor("Blue").setDescription(`🔀 **自動再生が無効になりました**`);
                                return interaction.reply({ embeds: [embed] });
                            }
                    }
            }

        } catch (error) {
            console.error(error);
            embed.setColor("Red").setDescription("エラーが発生しました。");
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
    }
}