const { validateDependencies } = require('./dependencyValidator');

function resolveDependencies(tasks) {
   validateDependencies(tasks);

   const dependencyCounts = {};
   const dependents = {};

   // Initialize dependency counts and dependent lists.
   for (const [taskName, task] of Object.entries(tasks)) {
      dependencyCounts[taskName] = task.dependsOn.length;
      dependents[taskName] = [];
   }

   // Build a reverse dependency map.
   for (const [taskName, task] of Object.entries(tasks)) {
      for (const dependency of task.dependsOn) {
         dependents[dependency].push(taskName);
      }
   }

   // Start with tasks that have no dependencies.
   const queue = Object.keys(tasks).filter(
      taskName => dependencyCounts[taskName] === 0
   );

   const executionOrder = [];
   let index = 0;

   while (index < queue.length) {
      const taskName = queue[index++];

      executionOrder.push(taskName);

      for (const dependent of dependents[taskName]) {
         dependencyCounts[dependent]--;

         if (dependencyCounts[dependent] === 0) {
            queue.push(dependent);
         }
      }
   }

   return executionOrder;
}

module.exports = {
   resolveDependencies
};