# Phase 01 — Core & Zod Adapter

> **Objetivo:** Tener un paquete funcional publicado como `0.1.0-alpha` que permita generar una spec OpenAPI 3.x básica con Zod.
> **Duración estimada:** Semanas 1–3
> **Criterio de éxito:** El ejemplo en `examples/plain-typescript/` genera un `openapi.json` válido que Swagger UI puede renderizar sin errores.

---

## Estado general

| Métrica | Valor |
|---|---|
| Total tareas | 32 |
| Completadas | 0 |
| En progreso | 0 |
| Pendientes | 32 |

---

## 1. Monorepo bootstrapping

- [ ] **M-01** Inicializar `package.json` raíz con `"private": true` y workspaces pnpm
- [ ] **M-02** Crear `pnpm-workspace.yaml` apuntando a `packages/*` y `examples/*`
- [ ] **M-03** Instalar y configurar Turborepo (`turbo.json`) con pipelines: `build`, `test`, `lint`, `typecheck`
- [ ] **M-04** Configurar `tsconfig.base.json` raíz con `strict: true`, `target: ES2020`, `module: NodeNext`
- [ ] **M-05** Configurar ESLint (flat config) con reglas: no `any` público, no default exports, import order
- [ ] **M-06** Configurar Prettier compartido
- [ ] **M-07** Añadir `madge` como devDependency raíz y script `check:circular`
- [ ] **M-08** Crear `.github/workflows/ci.yml` con jobs: typecheck, lint, circular-deps, test, coverage, build
- [ ] **M-09** Configurar `size-limit` o `bundlesize` en CI para validar tamaño de bundle

---

## 2. Paquete `@swagger-connect/core`

### 2.1 Setup del paquete

- [ ] **C-01** Crear `packages/core/package.json` (`name: @swagger-connect/core`, sin dependencias de producción)
- [ ] **C-02** Crear `packages/core/tsconfig.json` extendiendo `tsconfig.base.json`
- [ ] **C-03** Configurar `tsup` para compilar a ESM + CJS con declaraciones `.d.ts`
- [ ] **C-04** Definir `exports` en `package.json` para ESM y CJS

### 2.2 Tipos OpenAPI (`types/openapi.types.ts`)

- [ ] **C-05** Definir `OpenApiDocument` (raíz del documento)
- [ ] **C-06** Definir `InfoObject`, `ServerObject`, `TagObject`
- [ ] **C-07** Definir `PathsObject`, `PathItemObject`, `OperationObject`
- [ ] **C-08** Definir `RequestBodyObject`, `ResponseObject`, `ResponsesObject`
- [ ] **C-09** Definir `SchemaObject` (subset OpenAPI 3.x: type, properties, items, allOf, oneOf, anyOf, required, enum, format, nullable, description)
- [ ] **C-10** Definir `ParameterObject` (path, query, header)
- [ ] **C-11** Definir `SecuritySchemeObject`, `SecurityRequirementObject`
- [ ] **C-12** Definir `ComponentsObject`

### 2.3 Interfaz `ISchemaAdapter` (`adapters/ISchemaAdapter.ts`)

- [ ] **C-13** Declarar interfaz `ISchemaAdapter` con `name`, `canHandle(schema)`, `convert(schema)`
- [ ] **C-14** Declarar tipo `AnySchema` (opaco, para tipado del lado del usuario)

### 2.4 Errores (`errors/OpenApiError.ts`)

- [ ] **C-15** Crear clase base `OpenApiError extends Error` con campo `code: string`
- [ ] **C-16** Crear `OpenApiAdapterError` (schema no soportado o conversión fallida)
- [ ] **C-17** Crear `OpenApiValidationError` (RouteDefinition inválida)
- [ ] **C-18** Crear `OpenApiBuildError` (error en SpecAssembler)

### 2.5 `RouteRegistry`

- [ ] **C-19** Implementar `RouteRegistry` con método `register(route: RouteDefinition)` y `getRoutes(): ReadonlyArray<RouteDefinition>`
- [ ] **C-20** Validar que `path` tenga formato OpenAPI (`/users/{id}`)
- [ ] **C-21** Validar que `method` sea un valor del union type permitido
- [ ] **C-22** Validar que `responses` no esté vacío

### 2.6 `SchemaConverter`

- [ ] **C-23** Implementar `SchemaConverter` que recibe un `ISchemaAdapter[]` y expone `convert(schema): SchemaObject`
- [ ] **C-24** Lanzar `OpenApiAdapterError` si ningún adaptador puede manejar el schema

### 2.7 `SpecAssembler`

- [ ] **C-25** Implementar función pura `assembleSpec(registry, converter, options): OpenApiDocument`
- [ ] **C-26** Generar `paths` a partir de las rutas registradas
- [ ] **C-27** Generar `components.schemas` deduplicando schemas con nombre (si el adaptador los provee)
- [ ] **C-28** Incluir `info`, `servers`, `tags` desde las opciones del builder

### 2.8 `DocBuilder`

- [ ] **C-29** Implementar `DocBuilder` como fachada fluida con métodos: `addRoute`, `addRoutes`, `addTag`, `addSecurityScheme`, `addServer`, `build`, `toJSON`
- [ ] **C-30** Validar en constructor que `adapter` esté presente

### 2.9 `index.ts` y exports

- [ ] **C-31** Exportar desde `index.ts`: `DocBuilder`, `ISchemaAdapter`, `RouteDefinition`, `OpenApiDocument`, `SchemaObject`, todos los errores
- [ ] **C-32** Verificar que no hay default exports

---

## 3. Tests unitarios de `@swagger-connect/core`

- [ ] **T-01** Tests de `RouteRegistry`: registro correcto, validaciones de path/method/responses, errores esperados
- [ ] **T-02** Tests de `SchemaConverter`: delega al adaptador correcto, error si ninguno aplica
- [ ] **T-03** Tests de `SpecAssembler`: estructura del documento, paths generados, parámetros, requestBody, responses
- [ ] **T-04** Tests de `DocBuilder`: API fluida, `build()` retorna documento válido, `toJSON()` serializa correctamente
- [ ] **T-05** Tests de errores: cada clase de error tiene el `code` correcto y el mensaje esperado
- [ ] **T-06** Verificar cobertura ≥ 90% en líneas y branches

---

## 4. Paquete `@swagger-connect/zod-adapter`

- [ ] **Z-01** Crear `packages/zod-adapter/package.json` con `peerDependency: zod >=3.0.0` y `dependency: zod-to-json-schema`
- [ ] **Z-02** Crear `packages/zod-adapter/tsconfig.json`
- [ ] **Z-03** Configurar `tsup` para ESM + CJS
- [ ] **Z-04** Implementar `ZodSchemaAdapter` que implementa `ISchemaAdapter`
  - [ ] **Z-04a** `canHandle`: detecta instancias de `ZodType`
  - [ ] **Z-04b** `convert`: usa `zodToJsonSchema` y normaliza al tipo `SchemaObject`
  - [ ] **Z-04c** Manejo de tipos soportados: string, number, boolean, null, literal, enum, nativeEnum, object, array, union, intersection, optional, nullable, record, tuple, date, any, unknown
  - [ ] **Z-04d** Lanzar `OpenApiAdapterError` para tipos no soportados
- [ ] **Z-05** Exportar `ZodSchemaAdapter` desde `index.ts`
- [ ] **T-Z-01** Tests: cada tipo de Zod soportado produce el SchemaObject correcto
- [ ] **T-Z-02** Tests: tipos no soportados lanzan `OpenApiAdapterError`
- [ ] **T-Z-03** Verificar cobertura ≥ 85%

---

## 5. Ejemplo `examples/plain-typescript/`

- [ ] **E-01** Crear `examples/plain-typescript/package.json` con dependencia a `@swagger-connect/core` y `@swagger-connect/zod-adapter`
- [ ] **E-02** Implementar `src/routes.spec.ts` con al menos 3 rutas (GET, POST, DELETE) usando schemas Zod
- [ ] **E-03** Implementar `scripts/generate.ts` que genera `openapi.json`
- [ ] **E-04** Verificar que `openapi.json` generado pasa validación con `@apidevtools/swagger-parser`
- [ ] **E-05** Documentar cómo ejecutar el ejemplo en el `README.md` del ejemplo

---

## 6. Publicación `0.1.0-alpha`

- [ ] **P-01** Configurar Changesets en el monorepo
- [ ] **P-02** Crear `.changeset/` inicial con versión `0.1.0-alpha` para `core` y `zod-adapter`
- [ ] **P-03** Crear `.github/workflows/publish.yml` para publicación automática desde `main`
- [ ] **P-04** Verificar que ambos paquetes tienen `"publishConfig": { "access": "public" }`
- [ ] **P-05** Dry-run de publicación: `pnpm changeset publish --dry-run`
