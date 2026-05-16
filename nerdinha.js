require('dotenv').config();
const { Client, GatewayIntentBits, Events, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ] 
});

client.once(Events.ClientReady, c => {
    console.log(`Nerdinha Online: ${c.user.tag}`);
    
    // Iniciar monitoramento de logs
    watchLogs();
});

// Função para monitorar o latest.log do Minecraft
function watchLogs() {
    const logPath = path.join(__dirname, '../logs/latest.log');
    if (!fs.existsSync(logPath)) {
        console.error('Nerdinha: latest.log não encontrado!');
        return;
    }

    let fileSize = fs.statSync(logPath).size;
    fs.watch(logPath, (event) => {
        if (event === 'change') {
            const stats = fs.statSync(logPath);
            const newSize = stats.size;
            if (newSize > fileSize) {
                const stream = fs.createReadStream(logPath, { start: fileSize, end: newSize });
                stream.on('data', (chunk) => {
                    const lines = chunk.toString().split('\n');
                    lines.forEach(line => {
                        if (line.trim()) processLogLine(line);
                    });
                });
                fileSize = newSize;
            }
        }
    });
}

function processLogLine(line) {
    const logChannel = client.channels.cache.get(process.env.LOGS_CHANNEL_ID);
    const chatChannel = client.channels.cache.get(process.env.CHAT_CHANNEL_ID);
    if (!logChannel) return;

    // Enviar Logs (Entrou/Saiu/Morte/Erros)
    if (line.includes('joined the game') || line.includes('left the game') || line.includes('was slain by')) {
        logChannel.send(`\`\`\`${line}\`\`\``);
    }

    // Chat Sincronizado: Minecraft -> Discord
    // Formato comum: [HH:MM:SS] [Server thread/INFO]: <Player> Message
    const chatMatch = line.match(/\[.*\] \[Server thread\/INFO\]: <(.*)> (.*)/);
    if (chatMatch && chatChannel) {
        const player = chatMatch[1];
        const message = chatMatch[2];
        chatChannel.send(`**${player}**: ${message}`);
    }
}

// Chat Sincronizado: Discord -> Minecraft (via RCON)
client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;
    if (message.channelId !== process.env.CHAT_CHANNEL_ID) return;

    try {
        const { Rcon } = require('rcon-client');
        const rcon = await Rcon.connect({ 
            host: process.env.RCON_HOST, 
            port: parseInt(process.env.RCON_PORT), 
            password: process.env.RCON_PASSWORD 
        });
        await rcon.send(`tellraw @a {"text":"[Discord] ${message.author.username}: ${message.content}","color":"blue"}`);
        await rcon.end();
    } catch (err) {
        console.error('Nerdinha RCON Erro:', err);
    }
});

client.login(process.env.NERDINHA_TOKEN);
