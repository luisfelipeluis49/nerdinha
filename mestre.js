require('dotenv').config();
const { Client, GatewayIntentBits, Events, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, REST, Routes, MessageFlags } = require('discord.js');
const { Rcon } = require('rcon-client');
const { initDb, db } = require('./database');
const commands = require('./commands');
const { promisify } = require('util');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ] 
});

const dbGet = promisify(db.get).bind(db);
const dbRun = promisify(db.run).bind(db);

initDb();

const rest = new REST({ version: '10' }).setToken(process.env.MESTRE_TOKEN);

(async () => {
    try {
        console.log('Mestre: Registrando comandos Slash...');
        await rest.put(
            Routes.applicationGuildCommands(process.env.MESTRE_CLIENT_ID, process.env.GUILD_ID),
            { body: commands },
        );
        console.log('Mestre: Comandos Slash registrados!');
    } catch (error) {
        console.error('Mestre: Erro comandos:', error);
    }
})();

client.once(Events.ClientReady, c => {
    console.log(`Mestre Online: ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
    // Restringir comandos ao canal RP
    if (interaction.channelId !== process.env.RP_CHANNEL_ID && !interaction.isButton() && !interaction.isModalSubmit()) {
        if (interaction.isChatInputCommand()) {
            return interaction.reply({ content: `Por favor, use os comandos do Mestre apenas no canal <#${process.env.RP_CHANNEL_ID}>.`, flags: [MessageFlags.Ephemeral] });
        }
    }

    try {
        if (interaction.isChatInputCommand()) {
            const { commandName, options } = interaction;

            if (commandName === 'ficha') {
                const subcommand = options.getSubcommand();

                if (subcommand === 'criar') {
                    const modal = new ModalBuilder()
                        .setCustomId('ficha_modal_1')
                        .setTitle('Criação de Ficha - Passo 1');

                    modal.addComponents(
                        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('mc_nick').setLabel("Seu Nick no Minecraft").setStyle(TextInputStyle.Short).setRequired(true)),
                        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('char_name').setLabel("Nome do Personagem").setStyle(TextInputStyle.Short).setRequired(true)),
                        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('kingdom').setLabel("Reino").setStyle(TextInputStyle.Short).setRequired(true)),
                        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('origin').setLabel("Origem (Raça)").setStyle(TextInputStyle.Short).setRequired(true)),
                        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('function').setLabel("Função").setStyle(TextInputStyle.Short).setRequired(true))
                    );
                    await interaction.showModal(modal);
                }

                if (subcommand === 'ver') {
                    const targetUser = options.getUser('usuario') || interaction.user;
                    const row = await dbGet(`SELECT * FROM characters WHERE userId = ?`, [targetUser.id]);
                    if (!row) return interaction.reply({ content: 'Nenhuma ficha encontrada.', flags: [MessageFlags.Ephemeral] });

                    const embed = new EmbedBuilder()
                        .setTitle(`Ficha: ${row.charName}`)
                        .setColor(row.status === 'APPROVED' ? 0x00FF00 : 0xFFFF00)
                        .addFields(
                            { name: 'Nick MC', value: row.minecraftNick, inline: true },
                            { name: 'Reino', value: row.kingdom, inline: true },
                            { name: 'Status', value: row.status, inline: true },
                            { name: 'Lore', value: row.lore || 'Pendente' }
                        )
                        .setThumbnail(targetUser.displayAvatarURL());
                    await interaction.reply({ embeds: [embed] });
                }
            }
        }

        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'ficha_modal_1') {
                await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
                const data = {
                    nick: interaction.fields.getTextInputValue('mc_nick'),
                    name: interaction.fields.getTextInputValue('char_name'),
                    kingdom: interaction.fields.getTextInputValue('kingdom'),
                    origin: interaction.fields.getTextInputValue('origin'),
                    func: interaction.fields.getTextInputValue('function')
                };
                await dbRun(`INSERT OR REPLACE INTO characters (userId, minecraftNick, charName, kingdom, origin, function, status) VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
                    [interaction.user.id, data.nick, data.name, data.kingdom, data.origin, data.func]);

                const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('abrir_modal_2').setLabel('Passo 2: Lore e Skills').setStyle(ButtonStyle.Primary));
                await interaction.editReply({ content: 'Passo 1 salvo!', components: [row] });
            }

            if (interaction.customId === 'ficha_modal_2') {
                await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
                const lore = interaction.fields.getTextInputValue('lore');
                const skills = interaction.fields.getTextInputValue('skills');
                await dbRun(`UPDATE characters SET lore = ?, skills = ? WHERE userId = ?`, [lore, skills, interaction.user.id]);
                await interaction.editReply({ content: 'Ficha enviada para aprovação!' });

                const approvalChannel = client.channels.cache.get(process.env.APPROVAL_CHANNEL_ID);
                if (approvalChannel) {
                    const char = await dbGet(`SELECT * FROM characters WHERE userId = ?`, [interaction.user.id]);
                    const embed = new EmbedBuilder()
                        .setTitle(`Aprovação: ${char.charName}`)
                        .addFields({ name: 'Nick MC', value: char.minecraftNick }, { name: 'Lore', value: char.lore })
                        .setColor(0xFFFF00);
                    const buttons = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId(`approve_${char.userId}`).setLabel('Aprovar').setStyle(ButtonStyle.Success),
                        new ButtonBuilder().setCustomId(`reject_${char.userId}`).setLabel('Recusar').setStyle(ButtonStyle.Danger)
                    );
                    await approvalChannel.send({ embeds: [embed], components: [buttons] });
                }
            }
        }

        if (interaction.isButton()) {
            if (interaction.customId === 'abrir_modal_2') {
                const modal2 = new ModalBuilder().setCustomId('ficha_modal_2').setTitle('Criação de Ficha - Passo 2');
                modal2.addComponents(
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('lore').setLabel("Lore").setStyle(TextInputStyle.Paragraph).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('skills').setLabel("Skills").setStyle(TextInputStyle.Paragraph).setRequired(true))
                );
                await interaction.showModal(modal2);
            }

            if (interaction.customId.startsWith('approve_')) {
                await interaction.deferUpdate();
                const userId = interaction.customId.split('_')[1];
                const char = await dbGet(`SELECT * FROM characters WHERE userId = ?`, [userId]);
                try {
                    const rcon = await Rcon.connect({ host: process.env.RCON_HOST, port: parseInt(process.env.RCON_PORT), password: process.env.RCON_PASSWORD });
                    await rcon.send(`whitelist add ${char.minecraftNick}`);
                    await rcon.end();
                    await dbRun(`UPDATE characters SET status = 'APPROVED' WHERE userId = ?`, [userId]);
                    await interaction.editReply({ content: `✅ Ficha de <@${userId}> aprovada!`, embeds: [], components: [] });
                } catch (err) {
                    console.error('RCON Erro:', err);
                    await interaction.followUp({ content: 'Erro RCON.', flags: [MessageFlags.Ephemeral] });
                }
            }
        }
    } catch (error) {
        console.error('Mestre Interação Erro:', error);
    }
});

client.login(process.env.MESTRE_TOKEN);
