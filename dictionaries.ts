import * as fs from 'fs';

export async function fetchUUIDsPeriodically() {
    while (true) {
        fetchAllUUIDs();
        await new Promise(resolve => setTimeout(resolve, 300000)); // 5分ごとに実行
    }
}

export async function fetchAllUUIDs(retries = 3): Promise<{ [key: string]: any }> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch("http://localhost:10101/user_dict");
            if (!response.ok) {
                throw new Error(`Error fetching user dictionary: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Attempt ${attempt} - Error fetching user dictionary:`, error);
            if (attempt === retries) {
                return {};
            }
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
        }
    }
    return {};
}
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