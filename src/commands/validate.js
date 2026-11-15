const { findConfigFile, loadConfigFile } = require('../config/configLoader');
const { validateConfig } = require('../config/configValidator');

function validateCommand() {
   try {
      const configPath = findConfigFile();

      if (!configPath) {
         throw new Error('No configuration file found. Run "trun init" to create one.');
      }

      const rawConfig = loadConfigFile(configPath);
      validateConfig(rawConfig);

      console.log('Configuration is valid.');
      console.log(`File: ${configPath}`);
   } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exitCode = 1;
   }
}

module.exports = validateCommand;
