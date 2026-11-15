const fs = require('fs');
const inquirer = require('inquirer');
const YAML = require('yaml');
const { findConfigFile, loadConfigFile } = require('../config/configLoader');
const { validateConfig } = require('../config/configValidator');

async function deleteCommand(taskName) {
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

      const dependents = Object.entries(config.tasks)
         .filter(([name, task]) => {
            return name !== taskName && task.dependsOn.includes(taskName);
         })
         .map(([name]) => name);

      if (dependents.length > 0) {
         throw new Error(
            `Cannot delete "${taskName}". The following tasks depend on it: ${dependents.join(', ')}`
         );
      }

      const { confirm } = await inquirer.prompt([
         {
            type: 'confirm',
            name: 'confirm',
            message: `Are you sure you want to delete "${taskName}"?`,
            default: false
         }
      ]);

      if (!confirm) {
         console.log('Deletion cancelled.');
         return;
      }

      const document = YAML.parseDocument(
         fs.readFileSync(configPath, 'utf8')
      );

      document.deleteIn(['tasks', taskName]);

      fs.writeFileSync(configPath, document.toString());

      console.log(`Task "${taskName}" deleted successfully.`);
   } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exitCode = 1;
   }
}

module.exports = deleteCommand;