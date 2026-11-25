const { findConfigFile, loadConfigFile } = require('../config/configLoader');
const { validateConfig } = require('../config/configValidator');
const { runWorkflow } = require('../core/workflowRunner');

async function runCommand() {
   try {
      const configPath = findConfigFile();

      if (!configPath) {
         throw new Error('No configuration file found. Run "trun init" to create one.');
      }

      const rawConfig = loadConfigFile(configPath);
      const config = validateConfig(rawConfig);

      const taskNames = Object.keys(config.tasks);

      if (taskNames.length === 0) {
         console.log('No tasks configured. Add tasks to your trun.yml file.');
         return;
      }

      console.log(`Starting workflow (${taskNames.length} tasks)...`);

      const result = await runWorkflow(config.tasks, config.settings);

      const successful = result.results.filter(task => task.success).length;
      const failed = result.results.filter(task => !task.success).length;
      const skipped = result.skipped.length;

      console.log('\nWorkflow summary:');
      console.log(`Successful: ${successful}`);
      console.log(`Failed: ${failed}`);
      console.log(`Skipped: ${skipped}`);

      if (!result.success) {
         console.error('\nWorkflow failed.');
         process.exitCode = 1;
         return;
      }

      console.log('\nWorkflow completed successfully.');
   } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exitCode = 1;
   }
}

module.exports = runCommand;