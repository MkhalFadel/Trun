const test = require('node:test');
const assert = require('node:assert/strict');
const { runTask } = require('../src/core/taskRunner');
const fs = require('fs');
const os = require('os');
const path = require('path');

test('executes a command successfully', async () => {
   const result = await runTask({
      command: process.execPath,
      args: ['-e', 'process.stdout.write("Hello Trun")']
   });

   assert.equal(result.success, true);
   assert.equal(result.code, 0);
   assert.equal(result.stdout, 'Hello Trun');
});

test('captures standard error', async () => {
   const result = await runTask({
      command: process.execPath,
      args: ['-e', 'process.stderr.write("Something went wrong")']
   });

   assert.equal(result.success, true);
   assert.equal(result.stderr, 'Something went wrong');
});

test('returns a failed result for non-zero exit codes', async () => {
   const result = await runTask({
      command: process.execPath,
      args: ['-e', 'process.exit(1)']
   });

   assert.equal(result.success, false);
   assert.equal(result.code, 1);
});

test('uses task environment variables', async () => {
   const result = await runTask({
      command: process.execPath,
      args: ['-e', 'process.stdout.write(process.env.TRUN_TEST)'],
      env: {
         TRUN_TEST: 'working'
      }
   });

   assert.equal(result.stdout, 'working');
});

test('rejects commands that cannot be started', async () => {
   await assert.rejects(
      runTask({
         command: 'trun-command-that-does-not-exist',
         args: []
      }),
      /Failed to start/
   );
});

test('records execution duration', async () => {
   const result = await runTask({
      command: process.execPath,
      args: ['-e', 'setTimeout(() => process.exit(0), 100)']
   });

   assert.equal(result.success, true);
   assert.ok(result.duration >= 100);
});

test('retries a task until it succeeds', async t => {
   const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'trun-retry-'));
   const marker = path.join(directory, 'attempt');

   t.after(() => {
      fs.rmSync(directory, { recursive: true, force: true });
   });

   const result = await runTask({
      command: process.execPath,
      args: [
         '-e',
         `
            const fs = require('fs');

            if (!fs.existsSync(process.env.TRUN_MARKER)) {
               fs.writeFileSync(process.env.TRUN_MARKER, 'attempted');
               process.exit(1);
            }

            process.stdout.write('recovered');
         `
      ],
      env: {
         TRUN_MARKER: marker
      },
      retries: 1
   });

   assert.equal(result.success, true);
   assert.equal(result.attempts, 2);
   assert.equal(result.stdout, 'recovered');
});

test('returns failure after exhausting retries', async () => {
   const result = await runTask({
      command: process.execPath,
      args: ['-e', 'process.exit(1)'],
      retries: 2
   });

   assert.equal(result.success, false);
   assert.equal(result.attempts, 3);
});

test('terminates a task when its timeout expires', async () => {
   const result = await runTask({
      command: process.execPath,
      args: ['-e', 'setTimeout(() => {}, 1000)'],
      timeout: 100
   });

   assert.equal(result.success, false);
   assert.equal(result.timedOut, true);
});

test('uses the default timeout when no task timeout is provided', async () => {
   const result = await runTask({
      command: process.execPath,
      args: ['-e', 'setTimeout(() => {}, 1000)']
   }, 100);

   assert.equal(result.success, false);
   assert.equal(result.timedOut, true);
});