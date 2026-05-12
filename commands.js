const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

const commands = [
    new SlashCommandBuilder()
        .setName('ficha')
        .setDescription('Gerencia fichas de personagem')
        .addSubcommand(subcommand =>
            subcommand
                .setName('criar')
                .setDescription('Cria uma nova ficha de personagem'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('ver')
                .setDescription('Visualiza uma ficha')
                .addUserOption(option => option.setName('usuario').setDescription('Usuário para ver a ficha')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('editar')
                .setDescription('Edita sua ficha atual'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('deletar')
                .setDescription('Deleta sua ficha'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('imagem')
                .setDescription('Envia o template da ficha em imagem')),

    new SlashCommandBuilder()
        .setName('regras')
        .setDescription('Mostra as regras do servidor'),

    new SlashCommandBuilder()
        .setName('lore')
        .setDescription('Mostra a lore do mundo e dos reinos'),
].map(command => command.toJSON());

module.exports = commands;
