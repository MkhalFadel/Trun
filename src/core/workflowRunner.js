const { validateDependencies } = require('./dependencyValidator');
const { runTask } = require('./taskRunner');

async function runWorkflow(tasks, settings = {}) {
   validateDependencies(tasks);

   const taskNames = Object.keys(tasks);
   const maxParallel = settings.maxParallel ?? 3;
   const defaultTimeout = settings.defaultTimeout;

   const states = {};
   const results = [];
   const runningTasks = new Map();

   for (const taskName of taskNames) {
      states[taskName] = 'pending';
   }

   let failed = false;

   async function executeTask(taskName) {
      const task = tasks[taskName];

      console.log(`\nRunning task: ${taskName}`);

      try {
         const result = await runTask(task, defaultTimeout);

         results.push({
            taskName,
            ...result
         });

         states[taskName] = result.success ? 'success' : 'failed';

         if (!result.success) {
            console.error(`Task "${taskName}" failed.`);
            failed = true;
         }
      } catch (error) {
         console.error(`Task "${taskName}" failed: ${error.message}`);

         results.push({
            taskName,
            success: false,
            error: error.message
         });

         states[taskName] = 'failed';
         failed = true;
      }
   }

   while (true) {
      if (!failed) {
         const readyTasks = taskNames.filter(taskName => {
            return (
               states[taskName] === 'pending' &&
               tasks[taskName].dependsOn.every(
                  dependency => states[dependency] === 'success'
               )
            );
         });

         for (const taskName of readyTasks) {
            if (runningTasks.size >= maxParallel) {
               break;
            }

            states[taskName] = 'running';

            const promise = executeTask(taskName).then(() => {
               runningTasks.delete(taskName);
            });

            runningTasks.set(taskName, promise);
         }
      }

      if (runningTasks.size === 0) {
         break;
      }

      await Promise.race(runningTasks.values());
   }

   const skipped = taskNames.filter(
      taskName => states[taskName] === 'pending'
   );

   for (const taskName of skipped) {
      states[taskName] = 'skipped';
   }

   return {
      success: !failed,
      results,
      skipped
   };
}

module.exports = {
   runWorkflow
}; 