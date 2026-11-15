
const { z } = require('zod');

const settingsSchema = z.object({
   maxParallel: z.number().int().positive().default(3),
   defaultTimeout: z.number().int().positive().default(60000)
}).strict().default({});

const taskSchema = z.object({
   command: z.string().min(1),
   args: z.array(z.string()).default([]),
   cwd: z.string().optional(),
   dependsOn: z.array(z.string()).default([]),
   env: z.record(z.string()).optional(),
   timeout: z.number().int().positive().optional(),
   retries: z.number().int().nonnegative().default(0)
}).strict();

const configSchema = z.object({
   version: z.literal(1),
   settings: settingsSchema,
   tasks: z.record(taskSchema).default({})
}).strict();

function validateConfig(config) {
   const result = configSchema.safeParse(config);

   if (!result.success) {
      const errors = result.error.issues.map(issue => {
         const field = issue.path.join('.') || 'configuration';
         return `${field}: ${issue.message}`;
      });

      throw new Error(`Invalid configuration:\n${errors.join('\n')}`);
   }

   return result.data;
}

module.exports = {
   validateConfig
};
