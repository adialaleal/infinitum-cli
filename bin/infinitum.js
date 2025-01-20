#!/usr/bin/env node
const { program } = require('commander');
const { createProject } = require('../src/commands/create-project');
const { initAssistant } = require('../src/commands/init-assistant');
const { createFeature } = require('../src/commands/create-feature');

program
    .version('1.0.1')
    .description('CLI para projetos Flutter com Clean Architecture');

program
    .command('create <project-name>')
    .description('Criar novo projeto Flutter com estrutura de microapps')
    .action(createProject);

program
    .command('init-assistant')
    .description('Inicializar assistente LLM no projeto')
    .action(initAssistant);

program
    .command('create-feature <feature-name>')
    .description('Criar nova funcionalidade usando assistente LLM')
    .action(createFeature);

program.parse(process.argv);

module.exports = {
    createProject,
    initAssistant,
    createFeature
};