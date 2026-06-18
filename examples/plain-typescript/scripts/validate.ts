import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import SwaggerParser from '@apidevtools/swagger-parser';

const __dirname = dirname(fileURLToPath(import.meta.url));
const specPath = resolve(__dirname, '..', 'openapi.json');

try {
  const api = await SwaggerParser.validate(specPath);
  console.log(`✓ openapi.json is valid OpenAPI ${(api as { openapi?: string }).openapi}`);
  process.exit(0);
} catch (err) {
  console.error('✗ Validation failed:');
  console.error((err as Error).message);
  process.exit(1);
}
