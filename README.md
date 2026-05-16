# Minecraft Server & Discord Bots Integration

Este repositório contém os scripts dos bots do Discord e a documentação para o servidor de Minecraft RPG.

## 🤖 Os Bots

Para garantir estabilidade e evitar conflitos de comandos (especialmente com o Skoice), o sistema foi dividido em dois processos:

### 1. Bot Mestre (Fichas e RP)
Focado no Roleplay e gerenciamento de jogadores.
- **Arquivo:** `mestre.js`
- **Comandos:** `/ficha criar`, `/ficha ver`, `/ficha editar`.
- **Canal:** Deve ser usado exclusivamente no `#minecraft-rp`.
- **Whitelist:** Gerencia a aprovação de novos jogadores via RCON.

### 2. Bot Nerdinha (Skoice e Logs)
Focado na infraestrutura e comunicação técnica.
- **Arquivo:** `nerdinha.js`
- **Skoice:** Integração com o sistema de voz por proximidade.
- **Logs:** Monitora o `latest.log` e envia notificações de entrada/saída/morte no canal `#minecraft-logs`.
- **Chat Sincronizado:** Ponte de chat entre o canal `#minecraft` do Discord e o servidor In-game.

## 🛠️ Configuração

### Pré-requisitos
- Node.js (v18+)
- SQLite3
- Servidor Minecraft com RCON habilitado.

### Instalação
1. Clone o repositório.
2. Na pasta `discord-bot`, instale as dependências:
   ```bash
   npm install
   ```
3. Copie o `.env.example` para `.env` e preencha com seus tokens e IDs:
   ```bash
   cp .env.example .env
   ```

### Execução
Recomenda-se rodar os dois bots simultaneamente:
```bash
node mestre.js & node nerdinha.js
```

## ⚙️ Variáveis de Ambiente (.env)
- `MESTRE_TOKEN` / `NERDINHA_TOKEN`: Tokens dos bots no Discord Developer Portal.
- `LOGS_CHANNEL_ID`: Canal para logs do servidor.
- `CHAT_CHANNEL_ID`: Canal para o chat global sincronizado.
- `RP_CHANNEL_ID`: Canal para comandos de ficha e RP.
- `RCON_PASSWORD`: Senha configurada no `server.properties`.

---
*Atualizado em: Maio 2026*
