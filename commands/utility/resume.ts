import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, CommandInteractionOptionResolver } from "discord.js";
import { player } from "../../playmusic";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("resume")
        .setDescription("音楽を再開します"),
    async execute(interaction: CommandInteraction) {
        player.unpause();
        await interaction.reply("音楽を再開しました。");
    }
};