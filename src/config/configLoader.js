const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

const configFiles = ['trun.yml', 'trun.yaml'];

function findConfigFile(directory = process.cwd()) {
   for (const file of configFiles) {
      const filePath = path.join(directory, file);

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
         return filePath;
      }
   }

   return null;
}

function loadConfigFile(filePath) {
   if (!fs.existsSync(filePath)) {
      throw new Error(`Configuration file not found: ${filePath}`);
   }

   const content = fs.readFileSync(filePath, 'utf8');

   try {
      return YAML.parse(content);
   } catch (error) {
      throw new Error(`Failed to parse configuration file: ${error.message}`);
   }
}

module.exports = {
   findConfigFile,
   loadConfigFile
};
