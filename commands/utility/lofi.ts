import { SlashCommandBuilder } from "@discordjs/builders";
import { useQueue } from "discord-player"; // RepeatMode is not exported, using literal value instead
import { ChatInputCommandInteraction, GuildMember } from "discord.js";
import { client } from "../../index";
import spotifyApi from "../../spotify";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("lofi")
		.setDescription("Lo-Fi音楽を再生します (シャッフル＆ループ有効)"),
	async execute(interaction: ChatInputCommandInteraction) {
		if (!interaction.deferred && !interaction.replied) {
			await interaction.deferReply();
		}

		const guildId = interaction.guildId;
		if (!guildId) return await interaction.editReply({ content: "サーバー情報が取得できません。" });
		const guild = client.guilds.cache.get(guildId);
		if (!guild) return await interaction.editReply({ content: "サーバーが見つかりません。" });

		const member = guild.members.cache.get(interaction.user.id) as GuildMember;
		if (!member?.voice.channel) return await interaction.editReply({ content: "ボイスチャンネルに参加してください。" });

		const player = client.player;
		if (!player) return await interaction.editReply({ content: "プレイヤーが初期化されていません。" });

		let queue = useQueue(guildId);
		if (!queue) {
			queue = await player.nodes.create(guildId, {
				metadata: { channel: interaction.channel, voiceChannel: member.voice.channel }
			});
		}
		if (!queue.connection) await queue.connect(member.voice.channel);

		try {
			const playlistUrl = "https://open.spotify.com/playlist/0vvXsWCC9xrXsKd4FyS8kM";
			let tracksToAdd: any[] = []; // discord-playerのトラックオブジェクト群
			let searchQuery = playlistUrl;
			if (playlistUrl.includes("spotify.com/playlist/")) {
				const segments = playlistUrl.split("/");
				const playlistId = segments[segments.length - 1].split("?")[0];
				let playlistData;
				try {
					playlistData = await spotifyApi.getPlaylist(playlistId);
				} catch (spotifyError: any) {
					console.error("Spotify API error:", spotifyError);
					if (spotifyError.statusCode === 404) {
						console.log("指定されたプレイリストが見つからなかったため、代替クエリを使用します。");
						searchQuery = "lofi chill music";
					} else {
						return await interaction.editReply({ content: "Spotify プレイリストの取得に失敗しました。" });
					}
				}
				// プレイリスト取得に成功した場合
				if (playlistData && playlistData.body && playlistData.body.tracks.items.length > 0) {
					const items = playlistData.body.tracks.items;
					const MAX_TRACKS = 10;
                    // ランダムな順序に並び替えてから上限分を抽出する関数
                    const getRandomItems = <T>(arr: T[], count: number): T[] => {
                        const copy = [...arr];
                        for (let i = copy.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [copy[i], copy[j]] = [copy[j], copy[i]];
                        }
                        return copy.slice(0, count);
                    };
					const limitedItems = getRandomItems(items, MAX_TRACKS);
					// 各曲の情報から、Discord Player用の検索クエリを生成
					tracksToAdd = limitedItems
						.map(item => item.track)
						.filter(track => track != null)
						.map(track => `${track.name} ${track.artists.map((a: any) => a.name).join(" ")}`);
				} else {
					return await interaction.editReply({ content: "プレイリスト内に曲が見つかりませんでした。" });
				}
			}

			if (tracksToAdd.length > 0) {
				let allTracks: any[] = [];
				for (const query of tracksToAdd) {
					console.log("Spotify search query:", query);
					const res = await player.search(query, { requestedBy: interaction.user });
					const track = res.tracks[0];
					if (track) {
						allTracks.push(track);
					}
				}
				if (allTracks.length === 0) {
					return await interaction.editReply({ content: "指定された曲が見つかりませんでした。" });
				}
				// 複数曲をまとめてキューに追加（複数曲の場合は addTracks を使用）
				await queue.addTrack(allTracks);
				// ループ (RepeatMode 2: キュー全体) を設定
				queue.setRepeatMode(2);
				// 再生が開始されていなければ、キューの再生を開始（queue.node.play()はキューの先頭から再生します）
				if (!queue.node.isPlaying()) {
					await queue.node.play();
				}
				await interaction.editReply({ content: "音楽を再生しました (シャッフル＆ループ有効)" });
			} else {
				// 代替検索クエリを用いる場合
				const res = await player.search(searchQuery, { requestedBy: interaction.user });
				const track = res.tracks[0];
				if (!track) {
					return await interaction.editReply({ content: "指定された曲が見つかりませんでした。" });
				}
				await queue.play(track);
				await interaction.editReply({ content: "音楽を再生しました" });
			}
		} catch (error) {
			console.error("lofiコマンドでエラーが発生しました:", error);
			await interaction.editReply({ content: "ボイスチャンネルに接続できません" });
		}
	}
};