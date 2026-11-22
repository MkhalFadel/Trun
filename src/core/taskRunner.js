const { spawn } = require('child_process');
const path = require('path');

function runAttempt(task, timeout) {
   return new Promise((resolve, reject) => {
      const startTime = Date.now();

      let stdout = '';
      let stderr = '';
      let timedOut = false;
      let timeoutTimer;
      let killTimer;

      const child = spawn(task.command, task.args, {
         cwd: task.cwd ? path.resolve(task.cwd) : process.cwd(),
         env: {
            ...process.env,
            ...task.env
         },
         stdio: ['ignore', 'pipe', 'pipe']
      });

      if (timeout) {
         timeoutTimer = setTimeout(() => {
            timedOut = true;
            child.kill('SIGTERM');

            killTimer = setTimeout(() => {
               child.kill('SIGKILL');
            }, 1000);
         }, timeout);
      }

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
         clearTimeout(timeoutTimer);
         clearTimeout(killTimer);

         reject(new Error(
            `Failed to start "${task.command}": ${error.message}`
         ));
      });

      child.on('close', (code, signal) => {
         clearTimeout(timeoutTimer);
         clearTimeout(killTimer);

         resolve({
            success: code === 0 && !timedOut,
            code,
            signal,
            stdout,
            stderr,
            duration: Date.now() - startTime,
            timedOut
         });
      });
   });
}

async function runTask(task, defaultTimeout) {
   const retries = task.retries ?? 0;
   const timeout = task.timeout ?? defaultTimeout;

   let result;

   for (let attempt = 1; attempt <= retries + 1; attempt++) {
      result = await runAttempt(task, timeout);

      if (result.success) {
         return {
            ...result,
            attempts: attempt
         };
      }

      if (attempt <= retries) {
         console.log(`Task failed. Retrying (${attempt}/${retries})...`);
      }
   }

   return {
      ...result,
      attempts: retries + 1
   };
}

module.exports = {
   runTask
};