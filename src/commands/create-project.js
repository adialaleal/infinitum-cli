const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { execSync } = require('child_process');

async function createProject(projectName) {
    const projectDir = path.join(process.cwd(), `${projectName}_project`);

    // Criar estrutura básica
    await fs.mkdirp(projectDir);

    // Criar core_packages
    const corePackages = [
        `${projectName}_core`,
        `${projectName}_design`,
        `${projectName}_network`,
        `${projectName}_database`
    ];

    for (const pkg of corePackages) {
        await fs.mkdirp(path.join(projectDir, 'core_packages', pkg));
        // TODO: Adicionar template de cada pacote core
    }

    // Criar main_app
    const mainAppDir = path.join(projectDir, 'main_app');
    await fs.mkdirp(mainAppDir);
    await fs.mkdirp(path.join(mainAppDir, 'lib/bootstrap'));
    await fs.mkdirp(path.join(mainAppDir, 'lib/router'));
    await fs.mkdirp(path.join(mainAppDir, 'lib/core'));

    // Criar pasta micro_apps
    await fs.mkdirp(path.join(projectDir, 'micro_apps'));

    // Executar flutter create no main_app
    process.chdir(mainAppDir);
    execSync('flutter create .');

    console.log(chalk.green('✓ Projeto criado com sucesso!'));
}