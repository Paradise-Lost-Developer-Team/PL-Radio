import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, ButtonInteraction, Interaction, MessageFlags } from "discord.js";

class HelpMenu {
    private pages: EmbedBuilder[];
    private currentPage: number;

    constructor() {
        this.pages = [
            new EmbedBuilder()
                .setTitle("PL-Radio - 基本コマンド")
                .setDescription("PL-Radioの基本コマンド一覧です。")
                .addFields(
                    { name: "/ping", value: "BOTの接続状態を確認します。レイテンシと応答時間を表示します。" },
                    { name: "/filter", value: "音声フィルターを適用します。様々な音響効果を追加できます。" },
                    { name: "/help", value: "このヘルプメニューを表示します。" }
                )
                .setColor(0x3498db)
                .setFooter({ text: "ページ 1/3" }),
            new EmbedBuilder()
                .setTitle("PL-Radio - 音楽コマンド")
                .setDescription("音楽再生に関するコマンドです。")
                .addFields(
                    { name: "/music play", value: "音楽を再生します。URLまたは検索ワードを指定できます。" },
                    { name: "/music option", value: "音楽プレーヤーのオプションを設定します。リストから選択肢を選んで操作できます。(一時停止、再開、スキップ、ループモードなど)" },
                    { name: "/music volume", value: "音量を調整します (0-100)。" }
                )
                .setColor(0x1DB954)
                .setFooter({ text: "ページ 2/3" }),
            new EmbedBuilder()
                .setTitle("PL-Radio - 追加情報")
                .setDescription("使用上のヒントと追加情報です。")
                .addFields(
                    { name: "musicコマンド活用法", value: "`/music play` は YouTube、Spotify、SoundCloudなど様々なソースから再生できます。" },
                    { name: "optionコマンドの使い方", value: "`/music option` ではドロップダウンメニューから操作を選択できます。曲のスキップ、一時停止、再開、ループ設定などが可能です。" },
                    { name: "filterコマンド", value: "`/filter` ではbassboost、nightcore、vaporwaveなどの様々な音響効果を適用できます。" },
                    { name: "不具合の報告", value: "何か問題がありましたら、開発者へのPRまたはIssueでご連絡ください。" }
                )
                .setColor(0x34495E)
                .setFooter({ text: "ページ 3/3" })
        ];
        this.currentPage = 0;
    }

    public getCurrentPage(): EmbedBuilder {
        return this.pages[this.currentPage];
    }

    public nextPage(): EmbedBuilder {
        this.currentPage = (this.currentPage + 1) % this.pages.length;
        return this.getCurrentPage();
    }

    public previousPage(): EmbedBuilder {
        this.currentPage = (this.currentPage - 1 + this.pages.length) % this.pages.length;
        return this.getCurrentPage();
    }

    public getTotalPages(): number {
        return this.pages.length;
    }

    // currentPageのゲッターを追加
    public getCurrentPageNumber(): number {
        return this.currentPage;
    }
}

// インタラクションからHelpMenuを復元するための関数
function createMenuFromInteraction(interaction: ButtonInteraction): HelpMenu {
    const helpMenu = new HelpMenu();
    
    // メッセージの埋め込みからページ番号を取得
    if (interaction.message.embeds.length > 0) {
        const footerText = interaction.message.embeds[0].footer?.text || '';
        const match = footerText.match(/ページ (\d+)\/\d+/);
        if (match && match[1]) {
            const pageNumber = parseInt(match[1], 10) - 1; // 0-indexedに変換
            
            // ページ番号を設定（範囲内であることを確認）
            if (pageNumber >= 0 && pageNumber < helpMenu.getTotalPages()) {
                // 現在のページまで移動
                while (helpMenu.getCurrentPageNumber() !== pageNumber) {
                    helpMenu.nextPage();
                }
            }
        }
    }
    
    return helpMenu;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('利用可能なコマンドの一覧を表示します。'),
    async execute(interaction: ChatInputCommandInteraction) {
        const helpMenu = new HelpMenu();
        const helpText = helpMenu.getCurrentPage().data.description ?? '';
        const helpEmbed = helpMenu.getCurrentPage();
        const actionRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('previous')
                    .setLabel('前のページ')
                    .setStyle(ButtonStyle.Primary)
            )
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('次のページ')
                    .setStyle(ButtonStyle.Primary)
            );
        await interaction.reply({
            content: helpText,
            embeds: [helpEmbed],
            components: [actionRow]
        });
    },
    // HelpMenuを作成する関数をエクスポート
    createMenuFromInteraction
};