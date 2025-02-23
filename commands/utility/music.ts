import { SlashCommandBuilder } from '@discordjs/builders';
import { EmbedBuilder, PermissionFlagsBits, VoiceChannel, GuildEmoji, MessageFlags, ChatInputCommandInteraction } from 'discord.js';
import { ExtendedClient } from '../../index';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('music')
        .setDescription('音楽システム')
        .addSubcommand(subcommand =>
            subcommand
                .setName('play')
                .setDescription('音楽を再生します')
                .addStringOption(option =>
                    option
                        .setName('query')
                        .setDescription('再生する曲の名前またはURLを指定してください')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('volume')
                .setDescription('音楽の音量を調整します')
                .addNumberOption(option =>
                    option
                        .setName('percentage')
                        .setDescription('音量を設定します、10 = 10%')
                        .setMinValue(0)
                        .setMaxValue(100)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('options')
                .setDescription('音楽システムのオプション')
                .addStringOption(option =>
                    option
                        .setName('option')
                        .setDescription('オプションを指定してください')
                        .setRequired(true)
                        .addChoices(
                            { name: 'queue', value: 'queue' },
                            { name: 'skip', value: 'skip' },
                            { name: 'pause', value: 'pause' },
                            { name: 'resume', value: 'resume' },
                            { name: 'stop', value: 'stop' },
                            { name: 'loop-queue', value: 'loop-queue' },
                            { name: 'loop-all', value: 'loop-all' },
                            { name: 'autoplay', value: 'autoplay' },
                        )
                )
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        const { options, member, guild, channel } = interaction;
        const client = interaction.client as ExtendedClient;

        const subcommand = options.getSubcommand();
        const query = options.getString('query');
        const percentage = options.getNumber('percentage');
        const option = options.getString('option');
        const voiceChannel = member.voice.channel;

        const embed = new EmbedBuilder();

        if (!voiceChannel) {
            embed
                .setColor('Red')
                .setDescription('ボイスチャンネルに参加してください');
            return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
        if (!member.voice.channelId == guild.members.me.voice.channelId) {
            embed
                .setColor('Red')
                .setDescription(`音楽システムは既に <#${guild.members.me.voice.channelId}> でアクティブなので使用できません`);
            return await interaction.reply({ embeds: [embed] });
        }
        try {
            switch (subcommand) {
                case 'play':
                    client.distube.play(voiceChannel, query, { textChannel: channel, member: member });
                    return interaction.reply({ content: 'リクエストを受け付けました' });
                case 'volume':
                    client.distube.setVolume(voiceChannel, percentage);
                    return interaction.reply({ content: `音量レベルが ${percentage}% に設定されました` });
                case 'options':
                    const queue = await client.distube.getQueue(voiceChannel);

                    if (!queue) {
                        embed
                            .setColor('Red')
                            .setDescription('キューがアクティブではありません');
                        return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                    }
                    switch (option) {
                        case 'skip':
                            await queue.skip(voiceChannel);
                            embed
                                .setColor('Blue')
                                .setDescription('曲をスキップしました');
                            return await interaction.reply({ embeds: [embed] });
                        case 'stop':
                            await queue.stop(voiceChannel);
                            embed
                                .setColor('Blue')
                                .setDescription('再生を停止しました');
                            return await interaction.reply({ embeds: [embed] });
                        case 'pause':
                            await queue.pause(voiceChannel);
                            embed
                                .setColor('Blue')
                                .setDescription('曲を一時停止しました');
                            return await interaction.reply({ embeds: [embed] });
                        case 'resume':
                            await queue.resume(voiceChannel);
                            embed
                                .setColor('Blue')
                                .setDescription('曲を再開しました');
                            return await interaction.reply({ embeds: [embed] });
                        case 'queue':
                            embed
                                .setColor('Blue')
                                .setDescription(`キュー: ${queue.songs.map((song: any, id: number) => `**${id + 1}**. [${song.name}](${song.url}) - \`${song.formattedDuration}\``).join('\n')}`);
                            return await interaction.reply({ embeds: [embed] });
                        case 'loop-queue':
                            if (queue.repeatMode === 2) {
                                await client.distube.setRepeatMode(interaction, 0);
                                embed
                                    .setColor('Blue')
                                    .setDescription('トラックはスキップされます');
                                return await interaction.reply({ embeds: [embed] });
                            } else {
                                await client.distube.setRepeatMode(interaction, 2);
                                embed
                                    .setColor('Blue')
                                    .setDescription(`\`🔂\` | トラックはループモードです:** \`1曲\``);
                                return await interaction.reply({ embeds: [embed] });
                            }
                        case 'loop-all':
                            if (queue.repeatMode === 0) {
                                await client.distube.setRepeatMode(interaction, 1);
                                embed
                                    .setColor('Blue')
                                    .setDescription(`\`🔁\` | トラックはループモードです:** \`全て\``);
                                return await interaction.reply({ embeds: [embed] });
                            } else {
                                await client.distube.setRepeatMode(interaction, 0);
                                embed
                                    .setColor('Blue')
                                    .setDescription(`\`🔁\` | トラックはループモードではありません:** \`全て\``);
                                return await interaction.reply({ embeds: [embed] });
                            }
                        case 'autoplay':
                            if (!queue.autoplay) {
                                await client.distube.toggleAutoplay(interaction);
                                embed
                                    .setColor('Blue')
                                    .setDescription(`📻 *自動再生は:*\`アクティブ\``);
                                return await interaction.reply({ embeds: [embed] });
                            } else {
                                await client.distube.toggleAutoplay(interaction);
                                embed
                                    .setColor('Blue')
                                    .setDescription(`📻 *自動再生は:*\`非アクティブ\``);
                                return await interaction.reply({ embeds: [embed] });
                            }
                    }
            }
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'このコマンドの実行中にエラーが発生しました。', flags: MessageFlags.Ephemeral });
            } else {
                await interaction.reply({ content: 'このコマンドの実行中にエラーが発生しました', flags: MessageFlags.Ephemeral });
            }
        }
    }
};