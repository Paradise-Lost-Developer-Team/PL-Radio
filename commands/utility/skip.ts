import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, CommandInteractionOptionResolver } from "discord.js";
import { player } from "../../playmusic";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("skip")
        .setDescription("音楽をスキップします"),
    async execute(interaction: CommandInteraction) {
        player.stop();
        await interaction.reply("音楽をスキップしました。");
    }
};