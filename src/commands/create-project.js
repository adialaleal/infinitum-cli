const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { execSync } = require('child_process');
const inquirer = require('inquirer');

// Registrar editor personalizado para suportar Command + Enter
inquirer.registerPrompt('editor-cmd-enter', require('../prompts/editor-cmd-enter'));

async function createCorePackage(projectDir, packageName, template) {
    const corePackagesDir = path.join(projectDir, 'core_packages');
    const packageDir = path.join(corePackagesDir, packageName);
    
    // Criar diretório core_packages se não existir
    await fs.mkdirp(corePackagesDir);
    
    // Criar package Flutter
    const currentDir = process.cwd();
    try {
        process.chdir(corePackagesDir);
        execSync(`flutter create --template=package ${packageName}`);
    } finally {
        process.chdir(currentDir);
    }

    // Copiar template se existir
    if (template) {
        const templatePath = path.join(__dirname, '../templates/core_packages', template);
        const targetPath = path.join(packageDir, 'lib', `${packageName}.dart`);
        await fs.copy(templatePath, targetPath);
    }

    // Atualizar pubspec.yaml com dependências específicas
    const pubspecPath = path.join(packageDir, 'pubspec.yaml');
    let pubspec = await fs.readFile(pubspecPath, 'utf8');
    
    switch (packageName) {
        case 'database_package':
            pubspec = pubspec.replace('dependencies:', 'dependencies:\\n  sqflite: ^2.3.0\\n  path: ^1.8.3');
            break;
        case 'network_package':
            pubspec = pubspec.replace('dependencies:', 'dependencies:\\n  connectivity_plus: ^5.0.2');
            break;
        case 'design_package':
            // Não precisa de dependências adicionais
            break;
    }

    await fs.writeFile(pubspecPath, pubspec);
}

async function setupMainApp(projectDir, projectName) {
    const mainAppDir = path.join(projectDir, 'main_app');
    
    // Criar Flutter app
    const currentDir = process.cwd();
    try {
        process.chdir(projectDir);
        execSync(`flutter create --org com.${projectName} main_app`);
    } finally {
        process.chdir(currentDir);
    }

    // Copiar templates
    const templatesDir = path.join(__dirname, '../templates/main_app/lib');
    const mainAppLibDir = path.join(mainAppDir, 'lib');

    // Limpar diretório lib
    await fs.emptyDir(mainAppLibDir);
    
    // Copiar estrutura de arquivos
    await fs.copy(templatesDir, mainAppLibDir);

    // Atualizar pubspec.yaml com dependências
    const pubspecPath = path.join(mainAppDir, 'pubspec.yaml');
    let pubspec = await fs.readFile(pubspecPath, 'utf8');
    
    pubspec = pubspec.replace('dependencies:', `dependencies:
  get_it: ^7.6.7
  design_package:
    path: ../core_packages/design_package
  network_package:
    path: ../core_packages/network_package
  database_package:
    path: ../core_packages/database_package`);

    await fs.writeFile(pubspecPath, pubspec);
}

async function createProject(projectName) {
    console.log(chalk.blue('\nConfigure seu projeto (Use Command + Enter para enviar):\n'));
    
    const { projectConfig } = await inquirer.prompt([
        {
            type: 'editor-cmd-enter',
            name: 'projectConfig',
            message: 'Configuração do projeto (opcional)',
            default: `Descreva aqui configurações específicas do seu projeto:
- Temas e cores personalizadas
- Configurações de banco de dados
- Configurações de rede
- Outras configurações importantes`,
        }
    ]);

    const projectDir = path.join(process.cwd(), projectName);
    console.log(chalk.yellow('\nCriando estrutura do projeto...\n'));

    // Criar estrutura básica
    await fs.mkdirp(projectDir);

    // Criar e configurar core_packages
    const corePackages = [
        { name: 'design_package', template: 'design_package.dart' },
        { name: 'network_package', template: 'network_package.dart' },
        { name: 'database_package', template: 'database_package.dart' }
    ];

    for (const pkg of corePackages) {
        console.log(chalk.blue(`Criando ${pkg.name}...`));
        await createCorePackage(projectDir, pkg.name, pkg.template);
    }

    // Criar e configurar main_app
    console.log(chalk.blue('\nConfigurando main_app...'));
    await setupMainApp(projectDir, projectName);

    // Criar pasta micro_apps
    await fs.mkdirp(path.join(projectDir, 'micro_apps'));

    // Salvar configuração do projeto
    if (projectConfig.trim()) {
        await fs.writeFile(
            path.join(projectDir, 'project_config.yaml'),
            projectConfig.trim()
        );
    }

    console.log(chalk.green('\n✓ Projeto criado com sucesso!'));
    console.log(chalk.blue('\nEstrutura criada:'));
    console.log(chalk.cyan(`
${projectName}/
├── core_packages/
│   ├── design_package/     (Design System)
│   ├── network_package/    (Gerenciamento de Rede)
│   └── database_package/   (Banco de Dados Local)
├── main_app/              (Aplicativo Principal)
│   └── lib/
│       └── core/
│           ├── di/        (Injeção de Dependências)
│           ├── navigation/ (Roteamento Nativo)
│           └── app_widget.dart
└── micro_apps/           (Pasta para Micro Frontends)
`));

    console.log(chalk.yellow('\nPróximos passos:'));
    console.log(chalk.cyan(`
1. Configure suas rotas em lib/core/navigation/route_config.dart
2. Registre suas dependências em lib/core/di/service_locator.dart
3. Use o comando 'infinitum create-feature' para criar novos micro frontends
`));
}

module.exports = { createProject };