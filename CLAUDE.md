# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install          # install all dependencies
pnpm build            # build all packages (required before test/typecheck)
pnpm test             # run all tests
pnpm typecheck        # type-check all packages
pnpm lint             # ESLint
pnpm lint:fix         # ESLint with auto-fix
pnpm format           # Prettier write
pnpm check:circular   # detect circular deps in packages/
pnpm clean            # wipe dist + node_modules
```

Run a single package's tests directly:
```bash
cd packages/core && pnpm test
cd packages/zod-adapter && pnpm test
```

Run a single test file:
```bash
cd packages/core && pnpm vitest run test/RouteRegistry.test.ts
```

## Release flow (Changesets)

```bash
pnpm changeset          # create a changeset (describe the change)
pnpm changeset:version  # bump package versions + update CHANGELOG
pnpm changeset:publish  # build + publish to npm
```

Changesets config: `access: public`, `baseBranch: main`. Both packages are versioned independently.

## Architecture

This is a **pnpm + Turborepo monorepo**. Turbo task graph: `build` must run before `test` and `typecheck` — always run `pnpm build` first in a fresh checkout.

### Package: `@swagger-connect/core`

The core data flow is a pipeline of four collaborating classes:

1. **`RouteRegistry`** — validates and stores `RouteDefinition` objects. Validation happens at registration time (method enum, path regex, balanced braces, at least one response).
2. **`SchemaConverter`** — holds an ordered list of `ISchemaAdapter` instances; delegates `convert(schema)` to the first adapter whose `canHandle()` returns `true`.
3. **`SpecAssembler`** (`assembleSpec`) — maps `RouteDefinition[]` through `SchemaConverter` to produce the final `OpenApiDocument` plain object.
4. **`DocBuilder`** — the public facade. Owns a `RouteRegistry`, manages multiple adapters, and calls `assembleSpec` on `.build()`.

**Adapter contract** (`ISchemaAdapter`): `canHandle(schema): boolean` + `convert(schema): SchemaObject`. Multiple adapters can coexist; first match wins. Adapters must throw `OpenApiAdapterError` on failure.

**Error hierarchy** (`OpenApiError`): `OpenApiValidationError` (bad route input), `OpenApiAdapterError` (adapter conversion failure), `OpenApiBuildError` (assembly failure).

### Package: `@swagger-connect/zod-adapter`

Wraps `zod-to-json-schema` with `target: 'openApi3'` and `$refStrategy: 'none'`, then strips non-OpenAPI JSON Schema keys via an allowlist in `normalize()`. Depends on `@swagger-connect/core` as a workspace peer.

### Build output

Both packages output ESM (`dist/index.js`) and CJS (`dist/index.cjs`) via `tsup`. Size limits enforced in CI: `core ≤ 10 kB`, `zod-adapter ≤ 5 kB` (gzip).

## Conventions

- **`strict: true`** TypeScript everywhere. No `any` in public API signatures.
- All imports use `.js` extensions (ESM Node resolution) even for `.ts` source files.
- New schema adapters live in their own `packages/<name>-adapter/` and implement `ISchemaAdapter`.
- Path params use OpenAPI format: `/users/{id}`, not `:id`.

## Commits

Never add Claude as co-author. Commit messages belong solely to the git user configured in the repo.
