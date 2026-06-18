# @swagger-connect/core

## 0.1.1

### Patch Changes

- Fix import ordering, Prettier formatting, and coverage thresholds. Add tests for adapter edge cases including schema descriptions, unsupported types, and additional OpenAPI properties.

## 0.1.0

### Minor Changes

- Release v0.2.0-beta — all 4 schema adapters.
  - `@swagger-connect/core`: components.schemas auto-extraction for schemas with `title`
  - `@swagger-connect/zod-adapter`: Zod v3 support
  - `@swagger-connect/joi-adapter`: Joi >=17 support via `describe()` API
  - `@swagger-connect/yup-adapter`: Yup >=1 support via `describe()` API
  - `@swagger-connect/typebox-adapter`: TypeBox >=0.31 support
  - Documentation: `docs/adapters.md`, `docs/custom-adapter.md`
