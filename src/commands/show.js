const { findConfigFile, loadConfigFile } = require('../config/configLoader');
const { validateConfig } = require('../config/configValidator');

function showCommand(taskName) {
   try {
      const configPath = findConfigFile();

      if (!configPath) {
         throw new Error('No configuration file found. Run "trun init" to create one.');
      }

      const rawConfig = loadConfigFile(configPath);
      const config = validateConfig(rawConfig);
      const task = config.tasks[taskName];

      if (!task) {
         throw new Error(`Task "${taskName}" not found.`);
      }

      console.log(`Task: ${taskName}\n`);
      console.log(`Command: ${task.command}`);
      console.log(`Arguments: ${task.args.length > 0 ? task.args.join(' ') : 'None'}`);
      console.log(`Directory: ${task.cwd || '.'}`);
      console.log(`Timeout: ${task.timeout ?? config.settings.defaultTimeout}ms`);
      console.log(`Retries: ${task.retries}`);

      console.log(`Dependencies: ${
         task.dependsOn.length > 0 ? task.dependsOn.join(', ') : 'None'
      }`);

      if (task.env) {
         console.log('\nEnvironment variables:');

         for (const [key, value] of Object.entries(task.env)) {
            console.log(`  ${key}=${value}`);
         }
      }
   } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exitCode = 1;
   }
}

module.exports = showCommand;
