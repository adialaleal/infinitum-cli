const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const yaml = require('yaml');
const chalk = require('chalk');
const inquirer = require('inquirer');
const { Anthropic } = require('@anthropic-ai/sdk');

// Registrar editor personalizado para suportar Command + Enter
inquirer.registerPrompt('editor-cmd-enter', require('../prompts/editor-cmd-enter'));

async function extractFilesFromResponse(response) {
    const fileBlocks = response.match(/```[\s\S]*?```/g) || [];
    const files = [];

    for (const block of fileBlocks) {
        const content = block.replace(/```.*\n/, '').replace(/```$/, '');
        const filePathMatch = block.match(/```.*\/([^/]+\.[^/]+)/);
        
        if (filePathMatch) {
            files.push({
                path: filePathMatch[1],
                content: content.trim()
            });
        }
    }

    return files;
}

async function updateFeatureYaml(featureName, description) {
    const infinitumDir = '.infinitum';
    const featuresFile = path.join(infinitumDir, 'features.yaml');
    
    let features = {};
    if (await fs.pathExists(featuresFile)) {
        const content = await fs.readFile(featuresFile, 'utf8');
        features = yaml.parse(content) || {};
    }

    features[featureName] = {
        description,
        created_at: new Date().toISOString(),
        status: 'implemented'
    };

    await fs.writeFile(featuresFile, yaml.stringify(features));
}

async function createFeature(featureName) {
    console.log(chalk.blue('\nDescreva sua funcionalidade (Use Command + Enter para enviar):\n'));
    
    const { description } = await inquirer.prompt([
        {
            type: 'editor-cmd-enter',
            name: 'description',
            message: 'Descrição da funcionalidade',
            waitForSubmit: true
        }
    ]);

    if (!description.trim()) {
        console.log(chalk.red('❌ A descrição da funcionalidade é obrigatória.'));
        return;
    }

    console.log(chalk.yellow('\nProcessando sua solicitação...\n'));

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
    de uma nova funcionalidade '${featureName}' com a descrição:
    
    "${description}"
    
    Seguindo Clean Architecture.
    
    Por favor, forneça cada arquivo em um bloco de código separado com o caminho completo do arquivo como título.
    Exemplo:
    \`\`\`lib/features/example/example_file.dart
    // código aqui
    \`\`\`
    
    Arquivos atuais do projeto:
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

    // Extrair e criar arquivos da resposta
    const newFiles = await extractFilesFromResponse(message.content);
    const createdFiles = [];

    for (const file of newFiles) {
        const filePath = path.join(process.cwd(), file.path);
        await fs.ensureDir(path.dirname(filePath));
        await fs.writeFile(filePath, file.content);
        createdFiles.push(file.path);
    }

    // Atualizar YAML de features
    await updateFeatureYaml(featureName, description);

    // Atualizar timeline
    context.timeline.push({
        timestamp: new Date().toISOString(),
        action: `Created feature: ${featureName}`,
        description,
        files_analyzed: files.length,
        files_created: createdFiles
    });

    await fs.writeJSON('.infinitum/context.json', context, { spaces: 2 });

    console.log(chalk.green('\n✓ Funcionalidade criada com sucesso!'));
    console.log(chalk.blue('\nArquivos criados:'));
    createdFiles.forEach(file => console.log(chalk.cyan(`- ${file}`)));
}

module.exports = createFeature;