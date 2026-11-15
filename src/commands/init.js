
const fs = require('fs');
const path = require('path');
const { findConfigFile } = require('../config/configLoader');

function initCommand() {
   const configPath = findConfigFile();

   if (configPath) {
      console.error(`Error: Configuration already exists: ${configPath}`);
      process.exitCode = 1;
      return;
   }

   const defaultConfig = `version: 1

settings:
   maxParallel: 3
   defaultTimeout: 60000

tasks: {}
`;

   const filePath = path.join(process.cwd(), 'trun.yml');

   try {
      fs.writeFileSync(filePath, defaultConfig, { flag: 'wx' });

      console.log('Trun configuration created successfully.');
      console.log(`File: ${filePath}`);
   } catch (error) {
      console.error(`Error: Failed to create configuration: ${error.message}`);
      process.exitCode = 1;
   }
}

module.exports = initCommand;
