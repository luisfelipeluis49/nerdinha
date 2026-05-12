require('dotenv').config();
const { Client, GatewayIntentBits, Events, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, REST, Routes } = require('discord.js');
const { Rcon } = require('rcon-client');
const { initDb, db } = require('./database');
const commands = require('./commands');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

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
        console.error(error);
    }
})();

client.once(Events.ClientReady, c => {
    console.log(`Pronto! Logado como ${c.user.tag}`);
});

// Handler de Interações
client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) {
        const { commandName, options, subcommand } = interaction;

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
                db.get(`SELECT * FROM characters WHERE userId = ?`, [targetUser.id], (err, row) => {
                    if (err) return interaction.reply({ content: 'Erro ao buscar ficha.', ephemeral: true });
                    if (!row) return interaction.reply({ content: 'Nenhuma ficha encontrada para este usuário.', ephemeral: true });

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

                    interaction.reply({ embeds: [embed] });
                });
            }

            if (subcommand === 'deletar') {
                db.run(`DELETE FROM characters WHERE userId = ?`, [interaction.user.id], function(err) {
                    if (err) return interaction.reply({ content: 'Erro ao deletar ficha.', ephemeral: true });
                    interaction.reply({ content: 'Sua ficha foi deletada.', ephemeral: true });
                });
            }
            
            if (subcommand === 'imagem') {
                interaction.reply({ content: 'Aqui está o template da ficha (Em desenvolvimento: anexe a imagem aqui no futuro).', ephemeral: true });
            }
        }

        if (commandName === 'regras') {
            const embed = new EmbedBuilder()
                .setTitle('Regras do Servidor')
                .setDescription('1. Respeite todos os jogadores.\n2. Sem griefing.\n3. Roleplay obrigatório.')
                .setColor(0x0099FF);
            interaction.reply({ embeds: [embed] });
        }

        if (commandName === 'lore') {
            const embed = new EmbedBuilder()
                .setTitle('Lore do Mundo')
                .setDescription('Há muito tempo, os reinos viviam em paz...')
                .setColor(0xAA00FF);
            interaction.reply({ embeds: [embed] });
        }
    }

    // Handler de Submissão de Modal
    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'ficha_modal_1') {
            const mcNick = interaction.fields.getTextInputValue('mc_nick');
            const charName = interaction.fields.getTextInputValue('char_name');
            const kingdom = interaction.fields.getTextInputValue('kingdom');
            const origin = interaction.fields.getTextInputValue('origin');
            const func = interaction.fields.getTextInputValue('function');

            // Salvar temporariamente ou pedir o passo 2
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

            // Armazenar os dados do passo 1 em um objeto global temporário ou via botões.
            // Para simplicidade neste script, vamos salvar os dados do passo 1 e depois dar UPDATE no passo 2.
            db.run(`INSERT OR REPLACE INTO characters (userId, minecraftNick, charName, kingdom, origin, function, status) VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
                [interaction.user.id, mcNick, charName, kingdom, origin, func],
                async function(err) {
                    if (err) return interaction.reply({ content: 'Erro ao salvar passo 1.', ephemeral: true });
                    
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('abrir_modal_2')
                                .setLabel('Clique para preencher Lore e Skills')
                                .setStyle(ButtonStyle.Primary),
                        );

                    await interaction.reply({ content: 'Passo 1 concluído! Clique no botão abaixo para finalizar sua ficha.', components: [row], ephemeral: true });
                }
            );
        }

        if (interaction.customId === 'ficha_modal_2') {
            const lore = interaction.fields.getTextInputValue('lore');
            const skills = interaction.fields.getTextInputValue('skills');

            db.run(`UPDATE characters SET lore = ?, skills = ? WHERE userId = ?`, [lore, skills, interaction.user.id], function(err) {
                if (err) return interaction.reply({ content: 'Erro ao finalizar ficha.', ephemeral: true });
                
                interaction.reply({ content: 'Ficha enviada para aprovação!', ephemeral: true });

                // Enviar para o canal de aprovação
                const approvalChannel = client.channels.cache.get(process.env.APPROVAL_CHANNEL_ID);
                if (approvalChannel) {
                    db.get(`SELECT * FROM characters WHERE userId = ?`, [interaction.user.id], (err, row) => {
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

                        approvalChannel.send({ embeds: [embed], components: [buttons] });
                    });
                }
            });
        }
    }

    // Handler de Botões
    if (interaction.isButton()) {
        if (interaction.customId === 'abrir_modal_2') {
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
            const userId = interaction.customId.split('_')[1];
            
            db.get(`SELECT * FROM characters WHERE userId = ?`, [userId], async (err, row) => {
                if (!row) return interaction.reply({ content: 'Ficha não encontrada.', ephemeral: true });

                // Tentar RCON
                try {
                    const rcon = await Rcon.connect({
                        host: process.env.RCON_HOST,
                        port: parseInt(process.env.RCON_PORT),
                        password: process.env.RCON_PASSWORD,
                    });
                    await rcon.send(`whitelist add ${row.minecraftNick}`);
                    await rcon.end();

                    db.run(`UPDATE characters SET status = 'APPROVED' WHERE userId = ?`, [userId]);
                    
                    await interaction.update({ content: `✅ Ficha de <@${userId}> aprovada e adicionada à whitelist!`, embeds: [], components: [] });
                    
                    const user = await client.users.fetch(userId);
                    user.send("Sua ficha foi aprovada! Você já pode entrar no servidor.");
                } catch (rconErr) {
                    console.error('Erro RCON:', rconErr);
                    interaction.reply({ content: 'Erro ao conectar ao RCON do Minecraft. Verifique se o servidor está online.', ephemeral: true });
                }
            });
        }

        if (interaction.customId.startsWith('reject_')) {
            const userId = interaction.customId.split('_')[1];
            db.run(`DELETE FROM characters WHERE userId = ?`, [userId]);
            await interaction.update({ content: `❌ Ficha de <@${userId}> recusada e removida.`, embeds: [], components: [] });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
