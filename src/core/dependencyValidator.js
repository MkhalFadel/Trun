function validateDependencies(tasks) {
   const errors = [];

   // Check whether every dependency exists.
   for (const [taskName, task] of Object.entries(tasks)) {
      for (const dependency of task.dependsOn) {
         if (!tasks[dependency]) {
            errors.push(
               `Task "${taskName}" depends on "${dependency}", which does not exist.`
            );
         }
      }
   }

   // Track the state of each task during traversal.
   const states = {};
   const path = [];

   function visit(taskName) {
      if (states[taskName] === 'visited') {
         return;
      }

      if (states[taskName] === 'visiting') {
         const cycleStart = path.indexOf(taskName);
         const cycle = [...path.slice(cycleStart), taskName];

         errors.push(`Circular dependency detected: ${cycle.join(' -> ')}`);
         return;
      }

      states[taskName] = 'visiting';
      path.push(taskName);

      for (const dependency of tasks[taskName].dependsOn) {
         if (tasks[dependency]) {
            visit(dependency);
         }
      }

      path.pop();
      states[taskName] = 'visited';
   }

   for (const taskName of Object.keys(tasks)) {
      if (!states[taskName]) {
         visit(taskName);
      }
   }

   if (errors.length > 0) {
      throw new Error(`Dependency validation failed:\n${errors.join('\n')}`);
   }

   return true;
}

module.exports = {
   validateDependencies
};