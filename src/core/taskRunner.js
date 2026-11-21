const { spawn } = require('child_process');
const path = require('path');

function runTask(task) {
   return new Promise((resolve, reject) => {
      const startTime = Date.now();

      let stdout = '';
      let stderr = '';

      const child = spawn(task.command, task.args, {
         cwd: task.cwd ? path.resolve(task.cwd) : process.cwd(),
         env: {
            ...process.env,
            ...task.env
         },
         stdio: ['ignore', 'pipe', 'pipe']
      });

      child.stdout.on('data', data => {
         const output = data.toString();

         stdout += output;
         process.stdout.write(output);
      });

      child.stderr.on('data', data => {
         const output = data.toString();

         stderr += output;
         process.stderr.write(output);
      });

      child.on('error', error => {
         reject(new Error(
            `Failed to start "${task.command}": ${error.message}`
         ));
      });

      child.on('close', (code, signal) => {
         resolve({
            success: code === 0,
            code,
            signal,
            stdout,
            stderr,
            duration: Date.now() - startTime
         });
      });
   });
}

module.exports = {
   runTask
};