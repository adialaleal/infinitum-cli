const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const { Anthropic } = require('@anthropic/sdk');

async function createFeature(featureName) {
    // Carregar configuração
    const config = await fs.readJSON('.infinitum/config.json');
    const context = await fs.readJSON('.infinitum/context.json');

    const anthropic = new Anthropic({
        apiKey: config.anthropic_key
    });

    // Analisar arquivos do projeto
    const files = glob.sync('**/*.{dart,yaml}', {
        ignore: ['**/build/**', '**/.*/**', '**/test/**']
    });

    const fileContents = await Promise.all(
        files.map(async file => ({
            path: file,
            content: await fs.readFile(file, 'utf8')
        }))
    );

    // Gerar prompt para o Claude
    const prompt = `
    Analise os seguintes arquivos de um projeto Flutter e sugira a implementação
    de uma nova funcionalidade '${featureName}' seguindo Clean Architecture:
    
    ${fileContents.map(f => `${f.path}:\n${f.content}\n---`).join('\n')}
  `;

    // Chamar Claude
    const message = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 4000,
        messages: [{
            role: 'user',
            content: prompt
        }]
    });

    // Atualizar timeline
    context.timeline.push({
        timestamp: new Date().toISOString(),
        action: `Created feature: ${featureName}`,
        files_analyzed: files.length,
        changes_made: [] // TODO: Adicionar mudanças específicas
    });

    await fs.writeJSON('.infinitum/context.json', context, { spaces: 2 });

    // TODO: Processar resposta do Claude e criar arquivos
    console.log(chalk.green('✓ Funcionalidade criada com sucesso!'));
}