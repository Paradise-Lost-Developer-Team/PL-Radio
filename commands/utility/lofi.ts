import { SlashCommandBuilder } from "@discordjs/builders";
import { useQueue, Player } from "discord-player";
import { ChatInputCommandInteraction, MessageFlags, GuildMember } from "discord.js";
import { client } from "../../index"; // client をインポート
import { SpotifyExtractor } from '@discord-player/extractor';

// SpotifyExtractorのインスタンスを作成
const spotifyExtractor = new SpotifyExtractor();

module.exports = {
    data: new SlashCommandBuilder()
        .setName("lofi")
        .setDescription("Lo-Fi音楽を再生します"),
    async execute(interaction: ChatInputCommandInteraction) {
        const guildId = interaction.guildId;

        if (!guildId || !client.guilds) {
            console.error("guildId が取得できない、または client.guilds が undefined です。");
            return await interaction.reply({
                content: "エラー: サーバー情報が取得できません。",
                flags: MessageFlags.Ephemeral,
            });
        }

        const guild = client.guilds.cache.get(guildId);

        if (!guild) {
            console.error(`指定された guildId: ${guildId} のギルドが見つかりません`);
            return await interaction.reply({
                content: "エラー: サーバーが見つかりません。",
                flags: MessageFlags.Ephemeral,
            });
        }

        const member = guild.members.cache.get(interaction.user.id) as GuildMember;

        if (!member || !member.voice.channel) {
            return await interaction.reply({
                content: "ボイスチャンネルに参加してください",
                flags: MessageFlags.Ephemeral,
            });
        }

        const player = new Player(client); // メインプレイヤーを取得
        if (!interaction.guildId) {
            return interaction.reply("このコマンドはギルド内でのみ使用できます。");
        }

        const queue = useQueue(interaction.guildId);

        if (!queue) {
            // SpotifyExtractor をエクストラクターに登録
            player.extractors.register(spotifyExtractor);

            // プレイヤーのノードを作成
            await player.nodes.create(interaction.guildId, interaction.channel);
        }

        try {
            const queue = useQueue(interaction.guildId);
            if (!queue) {
                return interaction.reply("現在、音楽キューが存在しません。");
            }

            // Spotify プレイリストのリンクを使って検索
            const track = await player.search("https://open.spotify.com/playlist/0vvXsWCC9xrXsKd4FyS8kM?si=v55Pi5ItS-KCO2rqSMAxmg", {
                requestedBy: interaction.user,
            }).then(x => x.tracks[0]);

            if (!track) {
                return interaction.reply("指定された曲が見つかりませんでした。");
            }

            queue.play(track);
            return interaction.reply("音楽を再生しました");
        } catch (error) {
            console.error(error);
            return await interaction.reply({
                content: "ボイスチャンネルに接続できません",
                flags: MessageFlags.Ephemeral,
            });
        }
    },
};