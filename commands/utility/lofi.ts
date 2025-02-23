import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, CommandInteractionOptionResolver } from "discord.js";
import { playLofi } from "../../playlofi";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("lofi")
        .setDescription("Lo-Fi音楽を再生します"),
    async execute(interaction: CommandInteraction) {
        await playLofi(interaction);
    }
};