const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const cliPath = path.resolve(__dirname, '../src/index.js');

function runCli(config) {
   const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'trun-test-'));

   fs.writeFileSync(
      path.join(directory, 'trun.yml'),
      config
   );

   const result = spawnSync(process.execPath, [cliPath, 'run'], {
      cwd: directory,
      encoding: 'utf8'
   });

   fs.rmSync(directory, { recursive: true, force: true });

   return result;
}

test('runs all configured tasks successfully', () => {
   const config = `
version: 1

settings:
   maxParallel: 3
   defaultTimeout: 60000

tasks:
   first:
      command: echo
      args: ["First task completed"]

   second:
      command: echo
      args: ["Second task completed"]
      dependsOn: [first]
`;

   const result = runCli(config);

   assert.equal(result.status, 0);
   assert.match(result.stdout, /Successful: 2/);
   assert.match(result.stdout, /Failed: 0/);
   assert.match(result.stdout, /Skipped: 0/);
   assert.ok(
      result.stdout.indexOf('First task completed') <
      result.stdout.indexOf('Second task completed')
   );
});

test('handles an empty workflow', () => {
   const config = `
version: 1

settings:
   maxParallel: 3
   defaultTimeout: 60000

tasks: {}
`;

   const result = runCli(config);

   assert.equal(result.status, 0);
   assert.match(result.stdout, /No tasks configured/);
});

test('stops execution when a task fails', () => {
   const config = `
version: 1

settings:
   maxParallel: 3
   defaultTimeout: 60000

tasks:
   first:
      command: echo
      args: ["First task completed"]

   second:
      command: trun-nonexistent-command
      dependsOn: [first]

   third:
      command: echo
      args: ["Third task completed"]
      dependsOn: [second]
`;

   const result = runCli(config);

   assert.equal(result.status, 1);
   assert.match(result.stdout, /Successful: 1/);
   assert.match(result.stdout, /Failed: 1/);
   assert.match(result.stdout, /Skipped: 1/);
   assert.match(result.stderr, /Workflow failed/);
   assert.doesNotMatch(result.stdout, /Third task completed/);
});