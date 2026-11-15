const { findConfigFile, loadConfigFile } = require('./src/config/configLoader');
const { validateConfig } = require('./src/config/configValidator');

const file = findConfigFile();

if (!file) {
   throw new Error('No configuration file found');
}

const rawConfig = loadConfigFile(file);
const config = validateConfig(rawConfig);

console.log('Configuration loaded successfully:');
console.log(config);