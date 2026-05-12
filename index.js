require('dotenv').config();
const { Client, GatewayIntentBits, Events, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, REST, Routes, MessageFlags } = require('discord.js');
const { Rcon } = require('rcon-client');
const { initDb, db } = require('./database');
const commands = require('./commands');
const { promisify } = require('util');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

// Promisify DB calls
const dbGet = promisify(db.get).bind(db);
const dbRun = promisify(db.run).bind(db);

// Inicializar Banco de Dados
initDb();

// Registrar Comandos Slash
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Iniciando atualização dos comandos Slash...');
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands },
        );
        console.log('Comandos Slash registrados com sucesso!');
    } catch (error) {
        console.error('Erro ao registrar comandos:', error);
    }
})();

client.once(Events.ClientReady, c => {
    console.log(`Pronto! Logado como ${c.user.tag}`);
});

// Handler de Interações
client.on(Events.InteractionCreate, async interaction => {
    console.log(`Interação recebida: ${interaction.customId || interaction.commandName} de ${interaction.user.tag}`);
    try {
        if (interaction.isChatInputCommand()) {
            // ... (resto do código igual)

            if (commandName === 'ficha') {
                const subcommand = options.getSubcommand();

                if (subcommand === 'criar') {
                    const modal = new ModalBuilder()
                        .setCustomId('ficha_modal_1')
                        .setTitle('Criação de Ficha - Passo 1');

                    const nickInput = new TextInputBuilder()
                        .setCustomId('mc_nick')
                        .setLabel("Seu Nick no Minecraft")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true);

                    const nameInput = new TextInputBuilder()
                        .setCustomId('char_name')
                        .setLabel("Nome do Personagem")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true);

                    const kingdomInput = new TextInputBuilder()
                        .setCustomId('kingdom')
                        .setLabel("Reino")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true);

                    const originInput = new TextInputBuilder()
                        .setCustomId('origin')
                        .setLabel("Origem (Raça)")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true);

                    const functionInput = new TextInputBuilder()
                        .setCustomId('function')
                        .setLabel("Função")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true);

                    modal.addComponents(
                        new ActionRowBuilder().addComponents(nickInput),
                        new ActionRowBuilder().addComponents(nameInput),
                        new ActionRowBuilder().addComponents(kingdomInput),
                        new ActionRowBuilder().addComponents(originInput),
                        new ActionRowBuilder().addComponents(functionInput)
                    );

                    await interaction.showModal(modal);
                }

                if (subcommand === 'ver') {
                    const targetUser = options.getUser('usuario') || interaction.user;
                    const row = await dbGet(`SELECT * FROM characters WHERE userId = ?`, [targetUser.id]);
                    
                    if (!row) return interaction.reply({ content: 'Nenhuma ficha encontrada para este usuário.', flags: [MessageFlags.Ephemeral] });

                    const embed = new EmbedBuilder()
                        .setTitle(`Ficha de ${row.charName}`)
                        .setColor(row.status === 'APPROVED' ? 0x00FF00 : 0xFFFF00)
                        .addFields(
                            { name: 'Nick MC', value: row.minecraftNick, inline: true },
                            { name: 'Reino', value: row.kingdom, inline: true },
                            { name: 'Origem', value: row.origin, inline: true },
                            { name: 'Função', value: row.function, inline: true },
                            { name: 'Status', value: row.status, inline: true },
                            { name: 'Lore', value: row.lore || 'Não preenchido' },
                            { name: 'Skills', value: row.skills || 'Não preenchido' }
                        )
                        .setThumbnail(targetUser.displayAvatarURL());

                    await interaction.reply({ embeds: [embed] });
                }

                if (subcommand === 'editar') {
                    const row = await dbGet(`SELECT * FROM characters WHERE userId = ?`, [interaction.user.id]);
                    if (!row) return interaction.reply({ content: 'Você ainda não tem uma ficha para editar. Use `/ficha criar`.', flags: [MessageFlags.Ephemeral] });

                    const modal = new ModalBuilder()
                        .setCustomId('ficha_modal_1')
                        .setTitle('Editar Ficha - Passo 1');

                    const nickInput = new TextInputBuilder()
                        .setCustomId('mc_nick')
                        .setLabel("Seu Nick no Minecraft")
                        .setStyle(TextInputStyle.Short)
                        .setValue(row.minecraftNick)
                        .setRequired(true);

                    const nameInput = new TextInputBuilder()
                        .setCustomId('char_name')
                        .setLabel("Nome do Personagem")
                        .setStyle(TextInputStyle.Short)
                        .setValue(row.charName)
                        .setRequired(true);

                    const kingdomInput = new TextInputBuilder()
                        .setCustomId('kingdom')
                        .setLabel("Reino")
                        .setStyle(TextInputStyle.Short)
                        .setValue(row.kingdom)
                        .setRequired(true);

                    const originInput = new TextInputBuilder()
                        .setCustomId('origin')
                        .setLabel("Origem (Raça)")
                        .setStyle(TextInputStyle.Short)
                        .setValue(row.origin)
                        .setRequired(true);

                    const functionInput = new TextInputBuilder()
                        .setCustomId('function')
                        .setLabel("Função")
                        .setStyle(TextInputStyle.Short)
                        .setValue(row.function)
                        .setRequired(true);

                    modal.addComponents(
                        new ActionRowBuilder().addComponents(nickInput),
                        new ActionRowBuilder().addComponents(nameInput),
                        new ActionRowBuilder().addComponents(kingdomInput),
                        new ActionRowBuilder().addComponents(originInput),
                        new ActionRowBuilder().addComponents(functionInput)
                    );

                    await interaction.showModal(modal);
                }

                if (subcommand === 'deletar') {
                    await dbRun(`DELETE FROM characters WHERE userId = ?`, [interaction.user.id]);
                    await interaction.reply({ content: 'Sua ficha foi deletada.', flags: [MessageFlags.Ephemeral] });
                }
                
                if (subcommand === 'imagem') {
                    const imagePath = './template_ficha.png'; 
                    await interaction.reply({ 
                        content: 'Aqui está o template da ficha para preenchimento manual:', 
                        files: [imagePath],
                        flags: [MessageFlags.Ephemeral] 
                    }).catch(() => {
                        interaction.reply({ content: 'O arquivo `template_ficha.png` não foi encontrado na pasta do bot.', flags: [MessageFlags.Ephemeral] });
                    });
                }
            }

            if (commandName === 'regras') {
                const embed = new EmbedBuilder()
                    .setTitle('Regras do Servidor')
                    .setDescription('1. Respeite todos os jogadores.\n2. Sem griefing.\n3. Roleplay obrigatório.')
                    .setColor(0x0099FF);
                await interaction.reply({ embeds: [embed] });
            }

            if (commandName === 'lore') {
                const embed = new EmbedBuilder()
                    .setTitle('Lore do Mundo')
                    .setDescription('Há muito tempo, os reinos viviam em paz...')
                    .setColor(0xAA00FF);
                await interaction.reply({ embeds: [embed] });
            }
        }

        // Handler de Submissão de Modal
            if (interaction.isModalSubmit()) {
                if (interaction.customId === 'ficha_modal_1') {
                    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] }); // Agradece o Discord imediatamente

                    const mcNick = interaction.fields.getTextInputValue('mc_nick');
                    const charName = interaction.fields.getTextInputValue('char_name');
                    const kingdom = interaction.fields.getTextInputValue('kingdom');
                    const origin = interaction.fields.getTextInputValue('origin');
                    const func = interaction.fields.getTextInputValue('function');

                    await dbRun(`INSERT OR REPLACE INTO characters (userId, minecraftNick, charName, kingdom, origin, function, status) VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
                        [interaction.user.id, mcNick, charName, kingdom, origin, func]);

                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('abrir_modal_2')
                                .setLabel('Clique para preencher Lore e Skills')
                                .setStyle(ButtonStyle.Primary),
                        );

                    await interaction.editReply({ content: 'Passo 1 concluído! Clique no botão abaixo para finalizar sua ficha.', components: [row] });
                }

                if (interaction.customId === 'ficha_modal_2') {
                    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

                    const lore = interaction.fields.getTextInputValue('lore');
                    const skills = interaction.fields.getTextInputValue('skills');

                    await dbRun(`UPDATE characters SET lore = ?, skills = ? WHERE userId = ?`, [lore, skills, interaction.user.id]);

                    await interaction.editReply({ content: 'Ficha enviada para aprovação!' });

                    const approvalChannel = client.channels.cache.get(process.env.APPROVAL_CHANNEL_ID);
                    if (approvalChannel) {
                        const row = await dbGet(`SELECT * FROM characters WHERE userId = ?`, [interaction.user.id]);
                        const embed = new EmbedBuilder()
                            .setTitle(`Nova Ficha Pendente: ${row.charName}`)
                            .addFields(
                                { name: 'Usuário', value: `<@${row.userId}>`, inline: true },
                                { name: 'Nick MC', value: row.minecraftNick, inline: true },
                                { name: 'Reino', value: row.kingdom, inline: true },
                                { name: 'Lore', value: row.lore }
                            )
                            .setColor(0xFFFF00);

                        const buttons = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder().setCustomId(`approve_${row.userId}`).setLabel('Aprovar').setStyle(ButtonStyle.Success),
                                new ButtonBuilder().setCustomId(`reject_${row.userId}`).setLabel('Recusar').setStyle(ButtonStyle.Danger)
                            );

                        await approvalChannel.send({ embeds: [embed], components: [buttons] });
                    }
                }
            }

            // Handler de Botões
            if (interaction.isButton()) {
                if (interaction.customId === 'abrir_modal_2') {
                    // Nota: showModal DEVE ser a primeira resposta, não pode usar defer.
                    // Para evitar erro, criamos o modal antes de qualquer outra lógica.
                    const modal2 = new ModalBuilder()
                        .setCustomId('ficha_modal_2')
                        .setTitle('Criação de Ficha - Passo 2');

                    const loreInput = new TextInputBuilder()
                        .setCustomId('lore')
                        .setLabel("Lore (História)")
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(true);

                    const skillsInput = new TextInputBuilder()
                        .setCustomId('skills')
                        .setLabel("Skills (Características)")
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(true);

                    modal2.addComponents(
                        new ActionRowBuilder().addComponents(loreInput),
                        new ActionRowBuilder().addComponents(skillsInput)
                    );

                    await interaction.showModal(modal2);
                }

                if (interaction.customId.startsWith('approve_')) {
                    if (interaction.deferred || interaction.replied) return;
                    await interaction.deferUpdate(); 

                    const userId = interaction.customId.split('_')[1];
                    const row = await dbGet(`SELECT * FROM characters WHERE userId = ?`, [userId]);

                    if (!row) return interaction.followUp({ content: 'Ficha não encontrada.', flags: [MessageFlags.Ephemeral] });

                    try {
                        console.log(`Tentando RCON para aprovar: ${row.minecraftNick}`);
                        const rcon = await Rcon.connect({
                            host: process.env.RCON_HOST,
                            port: parseInt(process.env.RCON_PORT),
                            password: process.env.RCON_PASSWORD,
                        });
                        await rcon.send(`whitelist add ${row.minecraftNick}`);
                        await rcon.end();
                        console.log(`RCON Sucesso: Whitelist add ${row.minecraftNick}`);

                        await dbRun(`UPDATE characters SET status = 'APPROVED' WHERE userId = ?`, [userId]);
                        await interaction.editReply({ content: `✅ Ficha de <@${userId}> aprovada e adicionada à whitelist!`, embeds: [], components: [] });

                        const user = await client.users.fetch(userId);
                        await user.send("Sua ficha foi aprovada! Você já pode entrar no servidor.");
                    } catch (rconErr) {
                        console.error('Erro RCON:', rconErr);
                        await interaction.followUp({ content: 'Erro ao conectar ao RCON do Minecraft. Verifique se o servidor está online.', flags: [MessageFlags.Ephemeral] });
                    }
                    return;
                }
                if (interaction.customId.startsWith('reject_')) {
                    await interaction.deferUpdate();
                    const userId = interaction.customId.split('_')[1];
                    await dbRun(`DELETE FROM characters WHERE userId = ?`, [userId]);
                    await interaction.editReply({ content: `❌ Ficha de <@${userId}> recusada e removida.`, embeds: [], components: [] });
                }
            }    } catch (error) {
        console.error('Erro na interação:', error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'Ocorreu um erro ao processar esta ação.', flags: [MessageFlags.Ephemeral] }).catch(() => {});
        } else {
            await interaction.reply({ content: 'Ocorreu um erro ao processar esta ação.', flags: [MessageFlags.Ephemeral] }).catch(() => {});
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
