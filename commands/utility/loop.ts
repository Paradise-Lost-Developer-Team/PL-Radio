import { SlashCommandBuilder } from "@discordjs/builders";
import { client } from "../../index";
import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { Player } from "discord-player";

client.player = new Player(client);

module.exports = {
    data: new SlashCommandBuilder()
        .setName("loop")
        .setDescription("音楽をループします"),
    async execute(interaction: ChatInputCommandInteraction) {
        const queue = client.player.nodes.get(interaction.guildId!);
        if (!queue) return await interaction.reply({ content: "音楽が再生されていません", flags: MessageFlags.Ephemeral });
        await queue.setRepeatMode(queue.repeatMode === 2 ? 0 : 2);
        return await interaction.reply({ content: `ループモード: ${queue.repeatMode === 2 ? "ON" : "OFF"}`, flags: MessageFlags.Ephemeral });
    }
};