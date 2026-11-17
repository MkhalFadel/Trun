const test = require('node:test');
const assert = require('node:assert/strict');
const { validateDependencies } = require('../src/core/dependencyValidator');

test('validates a valid dependency chain', () => {
   const tasks = {
      install: { dependsOn: [] },
      build: { dependsOn: ['install'] },
      test: { dependsOn: ['build'] }
   };

   assert.equal(validateDependencies(tasks), true);
});

test('detects missing dependencies', () => {
   const tasks = {
      build: { dependsOn: ['install'] }
   };

   assert.throws(
      () => validateDependencies(tasks),
      /depends on "install", which does not exist/
   );
});

test('detects circular dependencies', () => {
   const tasks = {
      build: { dependsOn: ['test'] },
      test: { dependsOn: ['build'] }
   };

   assert.throws(
      () => validateDependencies(tasks),
      /Circular dependency detected/
   );
});

test('detects self-referencing dependencies', () => {
   const tasks = {
      build: { dependsOn: ['build'] }
   };

   assert.throws(
      () => validateDependencies(tasks),
      /Circular dependency detected: build -> build/
   );
});

test('accepts independent tasks', () => {
   const tasks = {
      build: { dependsOn: [] },
      test: { dependsOn: [] },
      lint: { dependsOn: [] }
   };

   assert.equal(validateDependencies(tasks), true);
});