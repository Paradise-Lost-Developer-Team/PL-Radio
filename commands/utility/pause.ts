import { SlashCommandBuilder } from "@discordjs/builders";
import { client } from "../../index";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pause")
    .setDescription("音楽を一時停止します"),

  run: async ({ client, interaction }: { client: any, interaction: any}) => {
    const queue = client.player.getQueue(interaction.guildId);

    if (!queue) {
      return await interaction.reply({
        content: "音楽が再生されていません",
        ephemeral: true,
      });
    }
    queue.pause();
    await interaction.reply({
      content: "一時停止しました",
    });
  },
};