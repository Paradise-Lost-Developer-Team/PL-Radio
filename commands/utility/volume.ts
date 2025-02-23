import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, CommandInteractionOptionResolver, MessageFlags } from "discord.js";
import { AudioPlayerStatus } from "@discordjs/voice";
import { player } from "../../playmusic";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("volume")
        .setDescription("音量を変更します")
        .addIntegerOption((option) => option.setName("volume").setDescription("音量").setRequired(true)),
    async execute(interaction: CommandInteraction) {
        const options = interaction.options as CommandInteractionOptionResolver;
        const volume = options.getInteger("level");
        if (!volume || volume < 0 || volume > 100) {
            await interaction.reply({
                content: "有効な音量を指定してください",
                flags: MessageFlags.Ephemeral
            })
            return;
        }
        if (player.state.status === AudioPlayerStatus.Playing) {
            const AudioResource = player.state.resource as any;
            AudioResource.volume.setVolume(volume / 100);
        }
        await interaction.reply(`音量を${volume}%に設定しました`);
    }
}