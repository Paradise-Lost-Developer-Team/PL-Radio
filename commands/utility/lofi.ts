import { SlashCommandBuilder } from "@discordjs/builders";
import { useQueue } from "discord-player";
import { ChatInputCommandInteraction, GuildMember, MessageFlags } from "discord.js";
import { client } from "../../index";
// SpotifyExtractor は index.ts で登録済みのため、こちらでは再登録しません

module.exports = {
	data: new SlashCommandBuilder()
		.setName("lofi")
		.setDescription("Lo-Fi音楽を再生します"),
	async execute(interaction: ChatInputCommandInteraction) {
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const guildId = interaction.guildId;
		if (!guildId) {
			return await interaction.editReply({ content: "サーバー情報が取得できません。" });
		}
		const guild = client.guilds.cache.get(guildId);
		if (!guild) {
			return await interaction.editReply({ content: "サーバーが見つかりません。" });
		}

		const member = guild.members.cache.get(interaction.user.id) as GuildMember;
		if (!member?.voice.channel) {
			return await interaction.editReply({ content: "ボイスチャンネルに参加してください。" });
		}

		// 3. player が未定義の場合のケア
		const player = client.player;
		if (!player) {
			return await interaction.editReply({ content: "プレイヤーが初期化されていません。" });
		}

		let queue = useQueue(guildId);
		if (!queue) {
			queue = await player.nodes.create(guildId, {
				metadata: { channel: interaction.channel, voiceChannel: member.voice.channel },
			});
		}
		if (!queue.connection) {
			await queue.connect(member.voice.channel);
		}

		try {
			const searchResult = await player.search(
				"https://open.spotify.com/playlist/0vvXsWCC9xrXsKd4FyS8kM",
				{ requestedBy: interaction.user }
			);
			const track = searchResult.tracks[0];
			if (!track) {
				return await interaction.editReply({ content: "指定された曲が見つかりませんでした。" });
			}

			// 2. play メソッドは await してエラーを適切に捕捉
			await queue.play(track);
			await interaction.editReply({ content: "音楽を再生しました" });
		} catch (error) {
			console.error("Error in lofi command:", error);
			await interaction.editReply({ content: "ボイスチャンネルに接続できません" });
		}
	}
};