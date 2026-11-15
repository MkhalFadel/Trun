#!/usr/bin/env node

const { program } = require('commander');
const packageJson = require('../package.json');

program
   .name('trun')
   .description('A developer-focused workflow automation CLI.')
   .version(packageJson.version, '-v, --version')
   .showHelpAfterError();

program.parse(process.argv);