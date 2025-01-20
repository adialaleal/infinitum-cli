const blessed = require('blessed');
const { Anthropic } = require('@anthropic-ai/sdk');
const fs = require('fs-extra');
const path = require('path');
const { createDiff } = require('diff');
const chalk = require('chalk');

class ChatUI {
    constructor() {
        this.screen = blessed.screen({
            smartCSR: true,
            title: 'Infinitum Chat'
        });

        // Chat history container
        this.chatBox = blessed.box({
            top: 0,
            left: 0,
            width: '100%',
            height: '90%',
            scrollable: true,
            alwaysScroll: true,
            tags: true,
            style: {
                fg: 'white'
            }
        });

        // Input box
        this.inputBox = blessed.textarea({
            bottom: 0,
            left: 0,
            width: '100%',
            height: '10%',
            inputOnFocus: true,
            padding: {
                top: 1,
                left: 2
            },
            style: {
                fg: 'white',
                bg: 'blue'
            }
        });

        // Status line
        this.statusLine = blessed.line({
            bottom: '10%',
            left: 0,
            width: '100%',
            orientation: 'horizontal',
            type: 'line',
            fg: 'blue'
        });

        // Add components to screen
        this.screen.append(this.chatBox);
        this.screen.append(this.inputBox);
        this.screen.append(this.statusLine);

        this.messages = [];
        this.setupHandlers();
    }

    setupHandlers() {
        // Quit on Ctrl-C or q
        this.screen.key(['C-c', 'q'], () => {
            this.saveChat();
            return process.exit(0);
        });

        // Submit on Cmd-Enter or Ctrl-Enter
        this.inputBox.key(['C-enter'], () => this.handleSubmit());
        this.screen.key(['C-enter'], () => this.handleSubmit());

        // Focus input by default
        this.inputBox.focus();
    }

    async handleSubmit() {
        const message = this.inputBox.getValue();
        if (!message.trim()) return;

        // Add user message to chat
        this.addMessage('user', message);
        this.inputBox.clearValue();
        this.screen.render();

        // Get AI response
        await this.getAIResponse(message);
    }

    addMessage(role, content) {
        const timestamp = new Date().toISOString();
        this.messages.push({ role, content, timestamp });

        const prefix = role === 'user' ? '{green-fg}You:{/green-fg}' : '{blue-fg}Assistant:{/blue-fg}';
        this.chatBox.pushLine(`${prefix} ${content}`);
        this.chatBox.setScrollPerc(100);
        this.screen.render();
    }

    async getAIResponse(userMessage) {
        try {
            const config = await fs.readJSON('.infinitum/config.json');
            const anthropic = new Anthropic({
                apiKey: config.anthropic_key
            });

            const response = await anthropic.messages.create({
                model: 'claude-3-opus-20240229',
                max_tokens: 4000,
                messages: [{
                    role: 'user',
                    content: `${userMessage}\n\nPor favor, ao fazer modificações em arquivos:\n1. Mostre apenas o nome do arquivo e o diff das mudanças\n2. Use o formato de diff do git\n3. Seja conciso nas explicações`
                }]
            });

            // Extract file changes from response
            const diffs = this.extractDiffs(response.content);
            
            // Add response to chat
            this.addMessage('assistant', response.content);

            // Save diffs if any
            if (diffs.length > 0) {
                await this.saveDiffs(diffs);
            }

        } catch (error) {
            this.addMessage('assistant', `Error: ${error.message}`);
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
        const timestamp = new Date().toISOString();
        const chatsDir = path.join(process.env.HOME, '.infinitum', 'chats');
        await fs.mkdirp(chatsDir);

        const chatFile = path.join(chatsDir, `${timestamp}.json`);
        await fs.writeJSON(chatFile, {
            timestamp,
            messages: this.messages
        }, { spaces: 2 });
    }
}

async function startChat() {
    // Verificar se está em um projeto válido
    if (!fs.existsSync('.infinitum/config.json')) {
        console.error(chalk.red('Erro: Execute este comando na raiz de um projeto Infinitum'));
        process.exit(1);
    }

    const ui = new ChatUI();
    ui.addMessage('assistant', 'Olá! Como posso ajudar com seu projeto Flutter hoje?');
}

module.exports = { startChat };
