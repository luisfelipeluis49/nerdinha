# RPG Character Manager Bot

Um bot de Discord customizado para gerenciar fichas de personagens de RPG e integrar automaticamente com a whitelist de um servidor Minecraft via RCON.

## 🚀 Funcionalidades

- **Sistema de Fichas (CRUD):**
  - `/ficha criar`: Processo de criação de ficha em dois passos usando Modals do Discord.
  - `/ficha ver`: Visualização de fichas de usuários.
  - `/ficha deletar`: Exclusão de ficha própria.
  - `/ficha imagem`: Template de imagem para preenchimento manual.
- **Integração com Minecraft:**
  - Sistema de aprovação manual por administradores via botões.
  - Adição automática à whitelist do servidor via **RCON** após aprovação.
- **Comandos de Informação:**
  - `/regras`: Exibe as regras do servidor.
  - `/lore`: Exibe a história do mundo.

## 🛠️ Tecnologias

- **Node.js**
- **discord.js v14**
- **SQLite3** (Banco de dados local)
- **rcon-client** (Comunicação com o servidor Minecraft)

## 📋 Pré-requisitos

- Node.js v16.11.0 ou superior.
- Um servidor Minecraft com **RCON habilitado** no `server.properties`.

## ⚙️ Configuração

1. Clone o repositório.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Crie um arquivo `.env` na raiz da pasta `discord-bot` seguindo o modelo:
   ```env
   DISCORD_TOKEN=seu_token_aqui
   GUILD_ID=id_do_seu_servidor
   APPROVAL_CHANNEL_ID=id_do_canal_de_aprovacao
   RCON_HOST=127.0.0.1
   RCON_PORT=25575
   RCON_PASSWORD=sua_senha_rcon
   ```

## 🎮 Como Usar

Para iniciar o bot:
```bash
node index.js
```

Os comandos Slash serão registrados automaticamente no servidor especificado no `GUILD_ID`.

## 🔒 Segurança

O arquivo `.env` e o banco de dados `characters.db` estão incluídos no `.gitignore` para evitar o vazamento de dados sensíveis. Nunca compartilhe seu Token do bot ou senha RCON.
