#!/usr/bin/env node

const { program } = require('commander');
const packageJson = require('../package.json');
const validateCommand = require('./commands/validate');
const initCommand = require('./commands/init');
const listCommand = require('./commands/list');
const showCommand = require('./commands/show');
const createCommand = require('./commands/create');
const deleteCommand = require('./commands/delete');
const runCommand = require('./commands/run');

program
   .name('trun')
   .description('A developer-focused workflow automation CLI.')
   .version(packageJson.version, '-v, --version')
   .showHelpAfterError();

program
   .command('init')
   .description('Initialize Trun in the current directory.')
   .action(initCommand);

program
   .command('validate')
   .description('Validate the Trun configuration file.')
   .action(validateCommand);

program
   .command('list')
   .description('List all configured tasks.')
   .action(listCommand);

program
   .command('show <task>')
   .description('Display the configuration of a specific task.')
   .action(showCommand);

program
   .command('create <task>')
   .description('Create a new task interactively.')
   .action(createCommand);

program
   .command('delete <task>')
   .description('Delete a configured task.')
   .action(deleteCommand);

   
program
.command('run')
.description('Run all configured tasks.')
.action(runCommand);

program.parse(process.argv);