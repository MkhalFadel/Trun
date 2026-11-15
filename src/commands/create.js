const fs = require('fs');
const inquirer = require('inquirer');
const YAML = require('yaml');
const { findConfigFile, loadConfigFile } = require('../config/configLoader');
const { validateConfig } = require('../config/configValidator');

async function createCommand(taskName) {
   try {
      if (!/^[a-zA-Z0-9_-]+$/.test(taskName)) {
         throw new Error('Task names can only contain letters, numbers, hyphens, and underscores.');
      }

      const configPath = findConfigFile();

      if (!configPath) {
         throw new Error('No configuration file found. Run "trun init" to create one.');
      }

      const rawConfig = loadConfigFile(configPath);
      const config = validateConfig(rawConfig);

      if (config.tasks[taskName]) {
         throw new Error(`Task "${taskName}" already exists.`);
      }

      const answers = await inquirer.prompt([
         {
            type: 'input',
            name: 'command',
            message: 'Command to execute:',
            validate: value => value.trim().length > 0 || 'Command is required.'
         },
         {
            type: 'input',
            name: 'args',
            message: 'Arguments (space-separated):'
         },
         {
            type: 'input',
            name: 'cwd',
            message: 'Working directory (leave empty for project root):'
         },
         {
            type: 'checkbox',
            name: 'dependsOn',
            message: 'Select task dependencies:',
            choices: Object.keys(config.tasks)
         },
         {
            type: 'input',
            name: 'timeout',
            message: 'Timeout in milliseconds (leave empty for default):',
            validate: value => {
               if (!value.trim()) return true;

               return (
                  /^\d+$/.test(value) &&
                  Number(value) > 0
               ) || 'Timeout must be a positive integer.';
            }
         },
         {
            type: 'input',
            name: 'retries',
            message: 'Number of retries:',
            default: '0',
            validate: value => (
               /^\d+$/.test(value)
            ) || 'Retries must be a non-negative integer.'
         }
      ]);

      const newTask = {
         command: answers.command.trim(),
         args: answers.args.trim() ? answers.args.trim().split(/\s+/) : [],
         dependsOn: answers.dependsOn,
         retries: Number(answers.retries)
      };

      if (answers.cwd.trim()) {
         newTask.cwd = answers.cwd.trim();
      }

      if (answers.timeout.trim()) {
         newTask.timeout = Number(answers.timeout);
      }

      const document = YAML.parseDocument(
         fs.readFileSync(configPath, 'utf8')
      );

      document.setIn(['tasks', taskName], newTask);

      validateConfig(document.toJSON());

      fs.writeFileSync(configPath, document.toString());

      console.log(`Task "${taskName}" created successfully.`);
   } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exitCode = 1;
   }
}

module.exports = createCommand;
