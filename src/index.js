#!/usr/bin/env node

const { program } = require('commander');
const packageJson = require('../package.json');
const validateCommand = require('./commands/validate');
const initCommand = require('./commands/init');
const listCommand = require('./commands/list');

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

   program.parse(process.argv);

