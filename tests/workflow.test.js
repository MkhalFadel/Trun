const test = require('node:test');
const assert = require('node:assert/strict');
const { runWorkflow } = require('../src/core/workflowRunner');

test('executes tasks in dependency order', async () => {
   const tasks = {
      test: {
         command: process.execPath,
         args: ['-e', 'process.exit(0)'],
         dependsOn: ['build']
      },
      build: {
         command: process.execPath,
         args: ['-e', 'process.exit(0)'],
         dependsOn: ['install']
      },
      install: {
         command: process.execPath,
         args: ['-e', 'process.exit(0)'],
         dependsOn: []
      }
   };

   const result = await runWorkflow(tasks);

   assert.equal(result.success, true);

   assert.deepEqual(
      result.results.map(task => task.taskName),
      ['install', 'build', 'test']
   );

   assert.deepEqual(result.skipped, []);
});

test('stops execution when a task fails', async () => {
   const tasks = {
      install: {
         command: process.execPath,
         args: ['-e', 'process.exit(0)'],
         dependsOn: []
      },
      build: {
         command: process.execPath,
         args: ['-e', 'process.exit(1)'],
         dependsOn: ['install']
      },
      test: {
         command: process.execPath,
         args: ['-e', 'process.exit(0)'],
         dependsOn: ['build']
      }
   };

   const result = await runWorkflow(tasks);

   assert.equal(result.success, false);

   assert.deepEqual(
      result.results.map(task => task.taskName),
      ['install', 'build']
   );

   assert.deepEqual(result.skipped, ['test']);
});

test('handles an empty workflow', async () => {
   const result = await runWorkflow({});

   assert.equal(result.success, true);
   assert.deepEqual(result.results, []);
   assert.deepEqual(result.skipped, []);
});

test('handles commands that cannot be started', async () => {
   const tasks = {
      build: {
         command: 'trun-command-that-does-not-exist',
         args: [],
         dependsOn: []
      },
      test: {
         command: process.execPath,
         args: ['-e', 'process.exit(0)'],
         dependsOn: ['build']
      }
   };

   const result = await runWorkflow(tasks);

   assert.equal(result.success, false);
   assert.equal(result.results[0].success, false);
   assert.match(result.results[0].error, /Failed to start/);
   assert.deepEqual(result.skipped, ['test']);
});