import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DocBuilder } from '@swagger-connect/core';
import { ZodSchemaAdapter } from '@swagger-connect/zod-adapter';

import { routes } from '../src/routes.spec.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(__dirname, '..', 'openapi.json');

const spec = new DocBuilder({
  info: {
    title: 'Users API',
    version: '1.0.0',
    description: 'A simple CRUD API for managing users — generated with swagger-connect.',
  },
  adapter: new ZodSchemaAdapter(),
  servers: [
    { url: 'http://localhost:3000', description: 'Local development' },
    { url: 'https://api.example.com', description: 'Production' },
  ],
  tags: [{ name: 'Users', description: 'User management operations' }],
})
  .addRoutes(routes)
  .build();

writeFileSync(outputPath, JSON.stringify(spec, null, 2), 'utf-8');
console.log(`✓ openapi.json generated at: ${outputPath}`);
console.log(`  Routes: ${Object.keys(spec.paths).length} paths`);
