import { SlashCommandBuilder } from "@discordjs/builders";
import { client } from "../../index";
import { ChatInputCommandInteraction, Client, CommandInteractionOptionResolver, MessageFlags } from "discord.js";
import { GuildQueue, Player } from "discord-player";

client.player = new Player(client);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("volume")
    .setDescription("音楽の音量を変更します")
    .addIntegerOption((option) => option.setName("level").setDescription("音量").setRequired(true)),

    async execute (client: Client, interaction: ChatInputCommandInteraction) {
        interface ExtendedClient extends Client {
            player?: Player;
          }
        const extendedClient = client as ExtendedClient;
        extendedClient.player = new Player(client);
        const guildId = interaction.guildId;
        if (guildId === null) {
        // Handle the case where guildId is null
        return await interaction.reply({
            content: "このコマンドはサーバー内でのみ使用できます",
            flags: MessageFlags.Ephemeral,
        });
        }
        const queue = (client as ExtendedClient).player?.queues.get(guildId);
          
        if (!queue) {
        return await interaction.reply({
            content: "音楽が再生されていません",
            flags: MessageFlags.Ephemeral,
            });
        }
          
        const options = interaction.options as CommandInteractionOptionResolver;
        (queue as any).volume = options.getInteger("level");
        await interaction.reply(`音量を${options.getInteger("level")}%に設定しました`);
    },
}