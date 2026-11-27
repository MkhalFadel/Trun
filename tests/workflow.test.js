const test = require('node:test');
const assert = require('node:assert/strict');
const { runWorkflow } = require('../src/core/workflowRunner');
const fs = require('fs');
const os = require('os');
const path = require('path');

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

test('passes retries through the workflow runner', async t => {
   const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'trun-workflow-'));
   const marker = path.join(directory, 'attempt');

   t.after(() => {
      fs.rmSync(directory, { recursive: true, force: true });
   });

   const tasks = {
      build: {
         command: process.execPath,
         args: [
            '-e',
            `
               const fs = require('fs');

               if (!fs.existsSync(process.env.TRUN_MARKER)) {
                  fs.writeFileSync(process.env.TRUN_MARKER, 'attempted');
                  process.exit(1);
               }
            `
         ],
         env: {
            TRUN_MARKER: marker
         },
         dependsOn: [],
         retries: 1
      }
   };

   const result = await runWorkflow(tasks);

   assert.equal(result.success, true);
   assert.equal(result.results[0].attempts, 2);
});

test('passes the default timeout through the workflow runner', async () => {
   const tasks = {
      build: {
         command: process.execPath,
         args: ['-e', 'setTimeout(() => {}, 1000)'],
         dependsOn: []
      }
   };

   const result = await runWorkflow(tasks, {
      defaultTimeout: 100
   });

   assert.equal(result.success, false);
   assert.equal(result.results[0].timedOut, true);
});

test('runs independent tasks in parallel', async () => {
   const startTimes = {};

   const tasks = {
      first: {
         command: process.execPath,
         args: [
            '-e',
            'setTimeout(() => console.log("first"), 500)'
         ],
         dependsOn: []
      },
      second: {
         command: process.execPath,
         args: [
            '-e',
            'setTimeout(() => console.log("second"), 500)'
         ],
         dependsOn: []
      }
   };

   const startTime = Date.now();

   const result = await runWorkflow(tasks, {
      maxParallel: 2,
      defaultTimeout: 60000
   });

   const duration = Date.now() - startTime;

   assert.equal(result.success, true);
   assert.equal(result.results.length, 2);
   assert.ok(duration < 900);
});

test('respects the maxParallel setting', async () => {
   const tasks = {
      first: {
         command: process.execPath,
         args: ['-e', 'setTimeout(() => {}, 300)'],
         dependsOn: []
      },
      second: {
         command: process.execPath,
         args: ['-e', 'setTimeout(() => {}, 300)'],
         dependsOn: []
      },
      third: {
         command: process.execPath,
         args: ['-e', 'setTimeout(() => {}, 300)'],
         dependsOn: []
      }
   };

   const startTime = Date.now();

   const result = await runWorkflow(tasks, {
      maxParallel: 2,
      defaultTimeout: 60000
   });

   const duration = Date.now() - startTime;

   assert.equal(result.success, true);
   assert.equal(result.results.length, 3);
   assert.ok(duration >= 500);
});

test('allows running tasks to finish after a failure', async () => {
   const tasks = {
      first: {
         command: process.execPath,
         args: ['-e', 'setTimeout(() => process.exit(1), 100)'],
         dependsOn: []
      },
      second: {
         command: process.execPath,
         args: ['-e', 'setTimeout(() => console.log("second finished"), 400)'],
         dependsOn: []
      },
      third: {
         command: 'echo',
         args: ['third'],
         dependsOn: []
      }
   };

   const result = await runWorkflow(tasks, {
      maxParallel: 2,
      defaultTimeout: 60000
   });

   assert.equal(result.success, false);
   assert.equal(result.results.length, 2);
   assert.ok(result.results.some(task => task.taskName === 'first'));
   assert.ok(result.results.some(task => task.taskName === 'second'));
   assert.deepEqual(result.skipped, ['third']);
});

test('waits for all dependencies before starting a task', async () => {
   const tasks = {
      first: {
         command: process.execPath,
         args: ['-e', 'setTimeout(() => {}, 300)'],
         dependsOn: []
      },
      second: {
         command: process.execPath,
         args: ['-e', 'setTimeout(() => {}, 500)'],
         dependsOn: []
      },
      third: {
         command: process.execPath,
         args: ['-e', 'console.log("third started")'],
         dependsOn: ['first', 'second']
      }
   };

   const result = await runWorkflow(tasks, {
      maxParallel: 2,
      defaultTimeout: 60000
   });

   assert.equal(result.success, true);
   assert.equal(result.results.length, 3);

   const firstIndex = result.results.findIndex(
      task => task.taskName === 'first'
   );

   const secondIndex = result.results.findIndex(
      task => task.taskName === 'second'
   );

   const thirdIndex = result.results.findIndex(
      task => task.taskName === 'third'
   );

   assert.ok(thirdIndex > firstIndex);
   assert.ok(thirdIndex > secondIndex);
});