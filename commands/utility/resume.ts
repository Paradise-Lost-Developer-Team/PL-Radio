import { SlashCommandBuilder } from "@discordjs/builders";
import { QueryType } from "discord-player";
import { client } from "../../index";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("resume")
    .setDescription("音楽の再生を再開します"),

  run: async ({ client, interaction }: { client: any, interaction: any}) => {
    const queue = client.player.getQueue(interaction.guildId);

    if (!queue) {
      return await interaction.reply({
        content: "音楽が再生されていません",
        ephemeral: true,
      });
    }
    queue.resume();
    await interaction.reply({
      content: "再開しました",
    });
  },
};