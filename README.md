# swagger-connect

Framework-agnostic OpenAPI 3.x document builder for Node.js/TypeScript.  
Generate a valid OpenAPI spec directly from the schemas you already have — no decorators, no framework coupling, no magic.

[![CI](https://github.com/your-org/swagger-connect/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/swagger-connect/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@swagger-connect/core)](https://www.npmjs.com/package/@swagger-connect/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Why swagger-connect?

Most OpenAPI tooling is invasive: decorators that couple your domain to a framework, code generation that runs in reverse, or config objects that duplicate what your types already say.

`swagger-connect` takes a different approach:

- **Bring Your Own Schema** — use Zod, Joi, Yup, TypeBox, or any custom validator you already have.
- **Framework-agnostic** — works with Express, Fastify, NestJS, Serverless Framework, or no framework at all.
- **Zero side effects** — importing the package doesn't touch your runtime, register routes, or modify prototypes.
- **TypeScript first** — fully typed API, `strict: true`, no `any` in public signatures.

---

## Packages

| Package | Description | npm |
|---|---|---|
| [`@swagger-connect/core`](packages/core/) | Core builder — DocBuilder, RouteRegistry, SpecAssembler | [![npm](https://img.shields.io/npm/v/@swagger-connect/core)](https://www.npmjs.com/package/@swagger-connect/core) |
| [`@swagger-connect/zod-adapter`](packages/zod-adapter/) | Zod schema adapter | [![npm](https://img.shields.io/npm/v/@swagger-connect/zod-adapter)](https://www.npmjs.com/package/@swagger-connect/zod-adapter) |

---

## Quick start

```bash
npm install @swagger-connect/core @swagger-connect/zod-adapter
# zod must already be in your project
```

```typescript
import { DocBuilder } from '@swagger-connect/core';
import { ZodSchemaAdapter } from '@swagger-connect/zod-adapter';
import { z } from 'zod';

const CreateUserBody = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

const UserResponse = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string(),
});

const spec = new DocBuilder({
  info: { title: 'My API', version: '1.0.0' },
  adapter: new ZodSchemaAdapter(),
})
  .addRoute({
    method: 'POST',
    path: '/users',
    summary: 'Create a user',
    tags: ['Users'],
    requestBody: CreateUserBody,
    responses: {
      201: UserResponse,
      400: z.object({ message: z.string() }),
    },
  })
  .build();

console.log(JSON.stringify(spec, null, 2));
```

---

## Examples

| Example | Description |
|---|---|
| [`examples/plain-typescript`](examples/plain-typescript/) | No framework — generate `openapi.json` from a script |

---

## Development

This is a **pnpm monorepo** managed with [Turborepo](https://turbo.build).

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run all tests
pnpm test

# Type check
pnpm typecheck

# Lint
pnpm lint

# Check for circular dependencies
pnpm check:circular
```

### Project structure

```
packages/
  core/           @swagger-connect/core
  zod-adapter/    @swagger-connect/zod-adapter
examples/
  plain-typescript/
specs/
  backlog/        Phase-by-phase task tracking
```

---

## Roadmap

See [`specs/backlog/BACKLOG.md`](specs/backlog/BACKLOG.md) for the full development plan.

- **Phase 01** (current) — Core + Zod adapter `0.1.0-alpha`
- **Phase 02** — Joi, Yup, TypeBox adapters `0.2.0-beta`
- **Phase 03** — Serverless Framework plugin `0.3.0-beta`
- **Phase 04** — CLI + framework examples `1.0.0`

---

## License

MIT — see [LICENSE](LICENSE).
