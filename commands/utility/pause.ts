import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, CommandInteractionOptionResolver } from "discord.js";
import { player } from "../../playmusic";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("pause")
        .setDescription("音楽を一時停止します"),
    async execute(interaction: CommandInteraction) {
        player.pause(true);
        await interaction.reply("音楽を一時停止しました。");
    }
};