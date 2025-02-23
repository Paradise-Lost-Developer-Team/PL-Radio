import { SlashCommandBuilder } from "@discordjs/builders";
import { client } from "../../index";
import { ChatInputCommandInteraction, Client, MessageFlags } from "discord.js";
import { Player } from "discord-player";

client.player = new Player(client);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pause")
    .setDescription("音楽を一時停止します"),

    async execute (client: Client, interaction: ChatInputCommandInteraction) {
        class ExtendedPlayer extends Player {
            getQueue(guildId: string): any {
                // implement the getQueue method here
            }
        }
          
        interface ExtendedInteraction extends ChatInputCommandInteraction {
            guildId: string;
        }
          
        class ExtendedClient extends Client {
            player: ExtendedPlayer;
        
            constructor() {
                super({ intents: [] }); // or whatever properties are required
                this.player = new ExtendedPlayer(this); // Initialize the player property
            }
        }
          
          const player = (client as ExtendedClient).player as ExtendedPlayer;
        if ('getQueue' in player) {
            const guildId = interaction.guildId;
            if (guildId !== null) {
                const queue = player.getQueue(guildId);
                if (!queue) {
                    return await interaction.reply({
                        content: "音楽が再生されていません",
                        flags: MessageFlags.Ephemeral,
                    });
                  }
                  queue.pause();
                  await interaction.reply({
                    content: "一時停止しました",
                  });
            } else {
                console.error('Interaction is not happening within a guild');
                return;
            }
        }
  },
};