import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { stopMusic } from "../../playmusic";
import { stopLofi } from "../../playlofi";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("stop")
        .setDescription("音楽を停止します"),
    async execute(interaction: CommandInteraction) {
        await stopMusic(interaction);
        await stopLofi(interaction);
    }
};