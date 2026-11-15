
const { findConfigFile, loadConfigFile } = require('../config/configLoader');
const { validateConfig } = require('../config/configValidator');

function listCommand() {
   try {
      const configPath = findConfigFile();

      if (!configPath) {
         throw new Error('No configuration file found. Run "trun init" to create one.');
      }

      const rawConfig = loadConfigFile(configPath);
      const config = validateConfig(rawConfig);
      const tasks = Object.entries(config.tasks);

      if (tasks.length === 0) {
         console.log('No tasks found.');
         console.log('Add tasks to your trun.yml configuration file.');
         return;
      }

      console.log(`Tasks (${tasks.length}):\n`);

      for (const [name, task] of tasks) {
         const command = [task.command, ...task.args].join(' ');

         console.log(`  ${name}`);
         console.log(`    Command: ${command}`);
         console.log(`    Directory: ${task.cwd || '.'}`);

         if (task.dependsOn.length > 0) {
            console.log(`    Depends on: ${task.dependsOn.join(', ')}`);
         }

         console.log();
      }
   } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exitCode = 1;
   }
}

module.exports = listCommand;
