# Example: plain-typescript

Generates a valid `openapi.json` from pure TypeScript — no framework, no server, no runtime dependencies beyond the packages themselves.

## What this example covers

- Defining route schemas using Zod
- Using `DocBuilder` to assemble an OpenAPI 3.x document
- Generating `openapi.json` with a simple script
- Validating the output with `@apidevtools/swagger-parser`

## Routes defined

| Method | Path | Description |
|---|---|---|
| `GET` | `/users` | List users (pagination via query params) |
| `POST` | `/users` | Create a user |
| `GET` | `/users/{id}` | Get a user by ID |
| `PATCH` | `/users/{id}` | Update a user |
| `DELETE` | `/users/{id}` | Delete a user |

## Running

From the **monorepo root**, install deps first:

```bash
pnpm install
pnpm build
```

Then, from this directory or from the root:

```bash
# Generate openapi.json
pnpm --filter @swagger-connect-examples/plain-typescript generate

# Validate the generated spec
pnpm --filter @swagger-connect-examples/plain-typescript validate
```

Or directly from this directory:

```bash
cd examples/plain-typescript
pnpm generate
pnpm validate
```

The generated `openapi.json` will appear at `examples/plain-typescript/openapi.json`.  
You can paste its contents into [editor.swagger.io](https://editor.swagger.io) to render it in Swagger UI.

## File structure

```
examples/plain-typescript/
├── src/
│   └── routes.spec.ts      ← Route definitions with Zod schemas
├── scripts/
│   ├── generate.ts         ← Generates openapi.json
│   └── validate.ts         ← Validates with swagger-parser
├── package.json
└── tsconfig.json
```
