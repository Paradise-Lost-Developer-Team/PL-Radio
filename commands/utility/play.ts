import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, CommandInteractionOptionResolver } from "discord.js";
import { playMusic } from "../../playmusic";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("音楽を再生します")
        .addStringOption((option) =>
            option.setName("url").setDescription("再生する音楽のURL").setRequired(true)
        ),
    async execute(interaction: CommandInteraction) {
        const options = interaction.options as CommandInteractionOptionResolver;
        const url = options.getString("url");
        playMusic(interaction, url!);
    },
};