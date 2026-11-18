const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveDependencies } = require('../src/core/dependencyResolver');

test('resolves a simple dependency chain', () => {
   const tasks = {
      test: { dependsOn: ['build'] },
      build: { dependsOn: ['install'] },
      install: { dependsOn: [] }
   };

   assert.deepEqual(
      resolveDependencies(tasks),
      ['install', 'build', 'test']
   );
});

test('resolves independent tasks', () => {
   const tasks = {
      build: { dependsOn: [] },
      test: { dependsOn: [] },
      lint: { dependsOn: [] }
   };

   assert.deepEqual(
      resolveDependencies(tasks),
      ['build', 'test', 'lint']
   );
});

test('resolves multiple dependencies', () => {
   const tasks = {
      deploy: { dependsOn: ['build', 'test'] },
      build: { dependsOn: ['install'] },
      test: { dependsOn: ['install'] },
      install: { dependsOn: [] }
   };

   const result = resolveDependencies(tasks);

   assert.equal(result[0], 'install');
   assert.ok(result.indexOf('build') < result.indexOf('deploy'));
   assert.ok(result.indexOf('test') < result.indexOf('deploy'));
   assert.equal(result.at(-1), 'deploy');
});

test('rejects missing dependencies', () => {
   const tasks = {
      build: { dependsOn: ['install'] }
   };

   assert.throws(
      () => resolveDependencies(tasks),
      /depends on "install", which does not exist/
   );
});

test('rejects circular dependencies', () => {
   const tasks = {
      build: { dependsOn: ['test'] },
      test: { dependsOn: ['build'] }
   };

   assert.throws(
      () => resolveDependencies(tasks),
      /Circular dependency detected/
   );
});

test('handles an empty task list', () => {
   assert.deepEqual(resolveDependencies({}), []);
});