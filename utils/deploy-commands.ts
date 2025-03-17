import { Routes } from 'discord-api-types/v9';
import { REST } from '@discordjs/rest';
import { ExtendedClient } from '../index'; // client をインポート
import { clientId, TOKEN } from '../config.json';
import fs from 'node:fs';
import path from 'node:path';

console.log("Starting deploy-commands.ts");

export const deployCommands = async (client: ExtendedClient) => { // client を引数として受け取る
    const commands: any[] = [];
    // Grab all the command folders from the commands directory you created earlier
    const foldersPath = path.join(__dirname, '..', 'commands');
    console.log(`foldersPath: ${foldersPath}`);
    const commandFolders = fs.readdirSync(foldersPath);
    console.log(`commandFolders: ${commandFolders}`);

    for (const folder of commandFolders) {
        // Grab all the command files from the commands directory you created earlier
        const commandsPath = path.join(foldersPath, folder);
        console.log(`commandsPath: ${commandsPath}`);
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js') || file.endsWith('.ts')); 
        console.log(`commandFiles: ${commandFiles}`);
        // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            console.log(`filePath: ${filePath}`);
            try {
                
                console.log(`Trying to load command: ${filePath}`);
                const command = require(filePath);
                if ('data' in command && 'execute' in command) {
                    client.commands.set(command.data.name, command); // ✅ コマンドを登録
                }
                console.log(`Successfully loaded: ${filePath}`);
                if ('data' in command && 'execute' in command) {
                    commands.push(command.data.toJSON());
                    console.log(`Loaded command: ${command.data.name}`);
                } else {
                    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
                }
            } catch (error) {
                console.error(`Error loading command at ${filePath}:`, error);
            }
            
        }
    }

    const rest = new REST({ version: '9' }).setToken(TOKEN);

// and deploy your commands!
    try {
        console.log(`${commands.length}個のアプリケーション (/) コマンドの更新を開始しました。`);

        // The put method is used to fully refresh all commands in the guild with the current set
        const data: any = await rest.put(
            // Routes.applicationGuildCommands(clientId, guildId),
            Routes.applicationCommands(clientId),
            { body: commands },
        );

        console.log(`${data.length}個のアプリケーション（/）コマンドを同期しました。`);
    } catch (error) {
        // And of course, make sure you catch and log any errors!
        console.error(error);
    }
};

(async () => {
    // コマンドファイルを /commands フォルダから読み込み
    const commands = [];
    const commandsPath = path.join(__dirname, '..', 'build', 'js', 'commands');

    // ディレクトリが存在しない場合は作成
    if (!fs.existsSync(commandsPath)) {
        fs.mkdirSync(commandsPath, { recursive: true });
        console.log(`ディレクトリを作成しました: ${commandsPath}`);
    }

    try {
        // ディレクトリ内のファイルを読み取る
        const commandFolders = fs.readdirSync(commandsPath);
        for (const folder of commandFolders) {
            const folderPath = path.join(commandsPath, folder);
            const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                const filePath = path.join(folderPath, file);
                const command = require(filePath);
                if (command.data) {
                    commands.push(command.data.toJSON());
                }
            }
        }
    } catch (error) {
        console.error(`コマンドディレクトリの読み込みに失敗しました: ${error instanceof Error ? error.message : String(error)}`);
        console.log('コマンドが見つからない場合は、先にビルドを実行してください。');
    }
    
    const rest = new REST({ version: '9' }).setToken(TOKEN);
    try {
        console.log(`Started refreshing ${commands.length} global application (/) commands.`);
        await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands }
        );
        console.log(`Successfully reloaded global application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();