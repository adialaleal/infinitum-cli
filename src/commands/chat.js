const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const path = require('path');
const fs = require('fs-extra');
const { Anthropic } = require('@anthropic-ai/sdk');
const open = require('open');
const chalk = require('chalk');

class ChatServer {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = new Server(this.server);
        
        this.setupExpress();
        this.setupWebSocket();
        this.messages = [];
    }

    setupExpress() {
        this.app.use(express.static(path.join(__dirname, '../web/public')));
    }

    setupWebSocket() {
        this.io.on('connection', (socket) => {
            console.log(chalk.green('Cliente conectado'));

            socket.on('chat message', async (message) => {
                try {
                    await this.handleMessage(message, socket);
                } catch (error) {
                    console.error(chalk.red('Erro:'), error);
                    socket.emit('error', error.message);
                }
            });

            socket.on('disconnect', () => {
                console.log(chalk.yellow('Cliente desconectado'));
                this.saveChat();
            });
        });
    }

    async handleMessage(message, socket) {
        console.log(chalk.cyan('\nMensagem recebida:'), message);
        
        // Salvar mensagem do usuário
        this.messages.push({
            role: 'user',
            content: message,
            timestamp: new Date().toISOString()
        });

        try {
            const config = await fs.readJSON('.infinitum/config.json');
            const anthropic = new Anthropic({
                apiKey: config.anthropic_key
            });

            console.log(chalk.yellow('\nGerando resposta...'));

            const response = await anthropic.messages.create({
                model: 'claude-3-opus-20240229',
                max_tokens: 4000,
                messages: [{
                    role: 'user',
                    content: `${message}\n\nPor favor, ao fazer modificações em arquivos:\n1. Mostre apenas o nome do arquivo e o diff das mudanças\n2. Use o formato de diff do git\n3. Seja conciso nas explicações`
                }]
            });

            // Log token usage
            const tokenUsage = {
                input: response.usage?.input_tokens || 0,
                output: response.usage?.output_tokens || 0,
                total: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0)
            };

            console.log(chalk.blue('\nUso de tokens:'));
            console.log(chalk.gray('- Input:'), tokenUsage.input);
            console.log(chalk.gray('- Output:'), tokenUsage.output);
            console.log(chalk.gray('- Total:'), tokenUsage.total);

            // Enviar uso de tokens para o cliente
            socket.emit('token usage', tokenUsage);

            // Salvar resposta do assistente
            const assistantMessage = {
                role: 'assistant',
                content: response.content,
                timestamp: new Date().toISOString(),
                token_usage: tokenUsage
            };

            this.messages.push(assistantMessage);

            // Extrair e salvar diffs se houver
            const diffs = this.extractDiffs(response.content);
            if (diffs.length > 0) {
                console.log(chalk.magenta('\nDiffs encontrados:'), diffs.length);
                await this.saveDiffs(diffs);
            }

            // Enviar resposta para o cliente
            socket.emit('chat response', response.content);

            console.log(chalk.green('\nResposta enviada com sucesso!'));

        } catch (error) {
            console.error(chalk.red('\nErro ao gerar resposta:'), error);
            socket.emit('error', error.message);
        }
    }

    extractDiffs(content) {
        const diffs = [];
        const diffRegex = /```diff\n([\s\S]*?)```/g;
        let match;

        while ((match = diffRegex.exec(content)) !== null) {
            diffs.push(match[1]);
        }

        return diffs;
    }

    async saveDiffs(diffs) {
        const timestamp = new Date().toISOString();
        const diffsDir = path.join(process.env.HOME, '.infinitum', 'diffs');
        await fs.mkdirp(diffsDir);

        const diffFile = path.join(diffsDir, `${timestamp}.json`);
        await fs.writeJSON(diffFile, {
            timestamp,
            diffs
        }, { spaces: 2 });
    }

    async saveChat() {
        if (this.messages.length === 0) return;

        const timestamp = new Date().toISOString();
        const chatsDir = path.join(process.env.HOME, '.infinitum', 'chats');
        await fs.mkdirp(chatsDir);

        const chatFile = path.join(chatsDir, `${timestamp}.json`);
        await fs.writeJSON(chatFile, {
            timestamp,
            messages: this.messages
        }, { spaces: 2 });
    }

    start(port = 3000) {
        this.server.listen(port, () => {
            console.log(chalk.blue(`\nInfinitum Chat iniciado em http://localhost:${port}`));
            console.log(chalk.gray('Pressione Ctrl+C para encerrar\n'));
            open(`http://localhost:${port}`);
        });

        process.on('SIGINT', async () => {
            console.log(chalk.yellow('\nEncerrando chat...'));
            await this.saveChat();
            process.exit(0);
        });
    }
}

async function startChat() {
    // Verificar se está em um projeto válido
    if (!fs.existsSync('.infinitum/config.json')) {
        console.error(chalk.red('Erro: Execute este comando na raiz de um projeto Infinitum'));
        process.exit(1);
    }

    const server = new ChatServer();
    server.start();
}

module.exports = { startChat };
