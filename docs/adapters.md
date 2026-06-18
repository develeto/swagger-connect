# Schema Adapters

swagger-connect uses a plugin architecture for schema validation libraries. Each adapter wraps a specific validator and converts its schemas to OpenAPI 3.x Schema Objects.

## Official adapters

| Package | Validator | Peer dependency | Status |
|---|---|---|---|
| `@swagger-connect/zod-adapter` | [Zod](https://zod.dev) | `zod >=3.0.0` | ✅ Stable |
| `@swagger-connect/joi-adapter` | [Joi](https://joi.dev) | `joi >=17.0.0` | ✅ Stable |
| `@swagger-connect/yup-adapter` | [Yup](https://github.com/jquense/yup) | `yup >=1.0.0` | ✅ Stable |
| `@swagger-connect/typebox-adapter` | [TypeBox](https://github.com/sinclairzx81/typebox) | `@sinclair/typebox >=0.31.0` | ✅ Stable |

## Usage

```typescript
import { DocBuilder } from '@swagger-connect/core';
import { ZodSchemaAdapter } from '@swagger-connect/zod-adapter';
import { JoiSchemaAdapter } from '@swagger-connect/joi-adapter';
import { z } from 'zod';
import Joi from 'joi';

// Single adapter
const spec = new DocBuilder({
  info: { title: 'My API', version: '1.0.0' },
  adapter: new ZodSchemaAdapter(),
}).build();

// Multiple adapters (first match wins)
const spec2 = new DocBuilder({
  info: { title: 'My API', version: '1.0.0' },
  adapter: new ZodSchemaAdapter(),
})
  .addAdapter(new JoiSchemaAdapter())
  .build();
```

## Creating a custom adapter

See [custom-adapter.md](./custom-adapter.md) for a step-by-step guide.
