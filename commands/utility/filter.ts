import { EmbedBuilder, SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { defaultFilters } from "distube";
import { ExtendedClient } from "../../index";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("filter")
		.setDescription("フィルターを設定する")
		.addStringOption(option =>
			option
				.setName("filter")
				.setDescription("設定するフィルター")
				.setRequired(true)
				.addChoices(...Object.keys(defaultFilters).map(k => ({ name: k, value: k })))
		),
	async execute(interaction: ChatInputCommandInteraction) {
		const client = interaction.client as ExtendedClient;
		const filter = interaction.options.getString("filter", true);
		const queue = client.distube.getQueue(interaction);
		if (!queue) {
			await interaction.reply({ content: "キューが存在しません。", ephemeral: true });
			return;
		}
		const filters = queue.filters;
		if (filters.has(filter)) filters.remove(filter);
		else filters.add(filter);
		await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor("Blurple")
					.setTitle("DisTube")
					.setDescription(`現在のフィルター: \`${filters.names.join(", ") || "オフ"}\``)
			]
		});
	}
};
