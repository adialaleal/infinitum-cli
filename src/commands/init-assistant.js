const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');

async function initAssistant() {
    // Verificar se está em um projeto válido
    if (!fs.existsSync('pubspec.yaml')) {
        console.error(chalk.red('Erro: Execute este comando na raiz de um projeto Flutter'));
        process.exit(1);
    }

    // Criar arquivo de configuração
    const config = {
        project_name: path.basename(process.cwd()),
        anthropic_key: '',
        context_file: '.infinitum/context.json',
        templates_dir: '.infinitum/templates'
    };

    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'anthropic_key',
            message: 'Digite sua chave API da Anthropic:'
        }
    ]);

    config.anthropic_key = answers.anthropic_key;

    // Criar diretório .infinitum
    await fs.mkdirp('.infinitum');
    await fs.writeJSON('.infinitum/config.json', config, { spaces: 2 });
    await fs.writeJSON('.infinitum/context.json', { timeline: [] }, { spaces: 2 });

    console.log(chalk.green('✓ Assistente inicializado com sucesso!'));
}