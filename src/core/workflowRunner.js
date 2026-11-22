const { resolveDependencies } = require('./dependencyResolver');
const { runTask } = require('./taskRunner');

async function runWorkflow(tasks, settings = {}) {
   const executionOrder = resolveDependencies(tasks);
   const results = [];

   for (let i = 0; i < executionOrder.length; i++) {
      const taskName = executionOrder[i];
      const task = tasks[taskName];

      console.log(`\nRunning task: ${taskName}`);

      try {
         const result = await runTask(task, settings.defaultTimeout);

         results.push({
            taskName,
            ...result
         });

         if (!result.success) {
            console.error(`Task "${taskName}" failed.`);

            return {
               success: false,
               results,
               skipped: executionOrder.slice(i + 1)
            };
         }
      } catch (error) {
         console.error(`Task "${taskName}" failed: ${error.message}`);

         results.push({
            taskName,
            success: false,
            error: error.message
         });

         return {
            success: false,
            results,
            skipped: executionOrder.slice(i + 1)
         };
      }
   }

   return {
      success: true,
      results,
      skipped: []
   };
}

module.exports = {
   runWorkflow
};