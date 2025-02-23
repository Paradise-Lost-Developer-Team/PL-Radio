import * as fs from 'fs';

export class ServerStatus {
    guildId: string;
    constructor(guildId: string) {
        this.guildId = guildId;
        this.saveTask();
        }

    async saveTask() {
        while (true) {
            console.log(`Saving guild id: ${this.guildId}`);
            try {
                fs.writeFileSync('guild_id.txt', this.guildId); // guild_id をファイルに保存
                await new Promise(resolve => setTimeout(resolve, 60000)); // 60秒ごとに保存
            } catch (error: any) {
                console.error("Error saving guild id:", error);
            }
        }
    }
}