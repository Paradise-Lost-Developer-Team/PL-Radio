import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { useQueue } from 'discord-player';
import { DisTube } from 'distube';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('music')
        .setDescription('音楽を再生・停止・スキップなど')
        .addSubcommand(subcommand =>
            subcommand
                .setName('play')
                .setDescription('音楽を再生')
                .addStringOption(option => option.setName('query').setDescription('曲名またはURL').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('volume')
                .setDescription('音量を設定')
                .addIntegerOption(option => option.setName('percentage').setDescription('10-100').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('skip')
                .setDescription('曲をスキップ'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('stop')
                .setDescription('音楽を停止'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('pause')
                .setDescription('音楽を一時停止'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('resume')
                .setDescription('音楽を再開')),
    async execute(interaction: any) {
        const { client, guild, member, options, channel } = interaction;

        if (!member) {
            return interaction.reply({ content: 'ボイスチャンネルに参加してからコマンドを実行してください。', ephemeral: true });
        }

        const voiceChannel = member.voice.channel;

        if (!voiceChannel) {
            return interaction.reply({ content: 'ボイスチャンネルに参加してからコマンドを実行してください。', ephemeral: true });
        }

        if (!guild) {
            return interaction.reply({ content: 'サーバーが見つかりませんでした。', ephemeral: true });
        }

        if (guild.members.me === null || guild.members.me.voice === null) {
            return interaction.reply({ content: 'Botがサーバーに参加していません。', ephemeral: true });
        }

        if (member.voice === null || !member.voice.channelId) {
            return interaction.reply({ content: 'ボイスチャンネルに参加してください。', ephemeral: true });
        }

        if (guild.members.me.voice.channelId && member.voice.channelId !== guild.members.me.voice.channelId) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(`音楽システムは既に <#${guild.members.me.voice.channelId}> でアクティブなので使用できません`)]
            });
        }

        const query = options.getString("query");
        const percentage = options.getInteger("percentage");

        try {
            switch (options.getSubcommand()) {
                case "play":
                    if (!query) return interaction.reply("曲名を入力してください");
                    await interaction.deferReply();
                    client.distube.play(voiceChannel, query, { textChannel: channel, member: member });
                    return interaction.editReply({ content: `リクエストを受け付けました: ${query}` });
                case "volume":
                    if (!percentage) return interaction.reply("10-100の数値を入力してください");
                    await interaction.deferReply();
                    client.distube.setVolume(voiceChannel, percentage);
                    return interaction.editReply({ content: `音量を${percentage}%に設定しました` });
                case "skip":
                    await interaction.deferReply();
                    const queue = client.distube.getQueue(guild);
                    if (!queue) return interaction.editReply("キューに曲がありません");
                    await queue.skip();
                    return interaction.editReply("曲をスキップしました");
                case "stop":
                    await interaction.deferReply();
                    const queueStop = client.distube.getQueue(guild);
                    if (!queueStop) return interaction.editReply("キューに曲がありません");
                    await queueStop.stop();
                    return interaction.editReply("音楽を停止しました");
                case "pause":
                    await interaction.deferReply();
                    const queuePause = client.distube.getQueue(guild);
                    if (!queuePause) return interaction.editReply("キューに曲がありません");
                    await queuePause.pause();
                    return interaction.editReply("音楽を一時停止しました");
                case "resume":
                    await interaction.deferReply();
                    const queueResume = client.distube.getQueue(guild);
                    if (!queueResume) return interaction.editReply("キューに曲がありません");
                    await queueResume.resume();
                    return interaction.editReply("音楽を再開しました");
            }
        } catch (e) {
            console.error(e);
            return interaction.reply({ content: `エラーが発生しました: ${e}`, ephemeral: true });
        }
    }
};