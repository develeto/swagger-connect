# Phase 01 — Core & Zod Adapter

> **Objetivo:** Tener un paquete funcional publicado como `0.1.0-alpha` que permita generar una spec OpenAPI 3.x básica con Zod.
> **Duración estimada:** Semanas 1–3
> **Criterio de éxito:** El ejemplo en `examples/plain-typescript/` genera un `openapi.json` válido que Swagger UI puede renderizar sin errores.

---

## Estado general

| Métrica | Valor |
|---|---|
| Total tareas | 57 |
| Completadas | 56 |
| En progreso | 0 |
| Pendientes | 1 |

---

## 1. Monorepo bootstrapping

- [x] **M-01** Inicializar `package.json` raíz con `"private": true` y workspaces pnpm
- [x] **M-02** Crear `pnpm-workspace.yaml` apuntando a `packages/*` y `examples/*`
- [x] **M-03** Instalar y configurar Turborepo (`turbo.json`) con pipelines: `build`, `test`, `lint`, `typecheck`
- [x] **M-04** Configurar `tsconfig.base.json` raíz con `strict: true`, `target: ES2020`, `module: NodeNext`
- [x] **M-05** Configurar ESLint (flat config) con reglas: no `any` público, no default exports, import order
- [x] **M-06** Configurar Prettier compartido
- [x] **M-07** Añadir `madge` como devDependency raíz y script `check:circular`
- [x] **M-08** Crear `.github/workflows/ci.yml` con jobs: typecheck, lint, circular-deps, test, coverage, build
- [x] **M-09** Configurar `size-limit` o `bundlesize` en CI para validar tamaño de bundle

---

## 2. Paquete `@swagger-connect/core`

### 2.1 Setup del paquete

- [x] **C-01** Crear `packages/core/package.json` (`name: @swagger-connect/core`, sin dependencias de producción)
- [x] **C-02** Crear `packages/core/tsconfig.json` extendiendo `tsconfig.base.json`
- [x] **C-03** Configurar `tsup` para compilar a ESM + CJS con declaraciones `.d.ts`
- [x] **C-04** Definir `exports` en `package.json` para ESM y CJS

### 2.2 Tipos OpenAPI (`types/openapi.types.ts`)

- [x] **C-05** Definir `OpenApiDocument` (raíz del documento)
- [x] **C-06** Definir `InfoObject`, `ServerObject`, `TagObject`
- [x] **C-07** Definir `PathsObject`, `PathItemObject`, `OperationObject`
- [x] **C-08** Definir `RequestBodyObject`, `ResponseObject`, `ResponsesObject`
- [x] **C-09** Definir `SchemaObject` (subset OpenAPI 3.x: type, properties, items, allOf, oneOf, anyOf, required, enum, format, nullable, description)
- [x] **C-10** Definir `ParameterObject` (path, query, header)
- [x] **C-11** Definir `SecuritySchemeObject`, `SecurityRequirementObject`
- [x] **C-12** Definir `ComponentsObject`

### 2.3 Interfaz `ISchemaAdapter` (`adapters/ISchemaAdapter.ts`)

- [x] **C-13** Declarar interfaz `ISchemaAdapter` con `name`, `canHandle(schema)`, `convert(schema)`
- [x] **C-14** Declarar tipo `AnySchema` (opaco, para tipado del lado del usuario)

### 2.4 Errores (`errors/OpenApiError.ts`)

- [x] **C-15** Crear clase base `OpenApiError extends Error` con campo `code: string`
- [x] **C-16** Crear `OpenApiAdapterError` (schema no soportado o conversión fallida)
- [x] **C-17** Crear `OpenApiValidationError` (RouteDefinition inválida)
- [x] **C-18** Crear `OpenApiBuildError` (error en SpecAssembler)

### 2.5 `RouteRegistry`

- [x] **C-19** Implementar `RouteRegistry` con método `register(route: RouteDefinition)` y `getRoutes(): ReadonlyArray<RouteDefinition>`
- [x] **C-20** Validar que `path` tenga formato OpenAPI (`/users/{id}`)
- [x] **C-21** Validar que `method` sea un valor del union type permitido
- [x] **C-22** Validar que `responses` no esté vacío

### 2.6 `SchemaConverter`

- [x] **C-23** Implementar `SchemaConverter` que recibe un `ISchemaAdapter[]` y expone `convert(schema): SchemaObject`
- [x] **C-24** Lanzar `OpenApiAdapterError` si ningún adaptador puede manejar el schema

### 2.7 `SpecAssembler`

- [x] **C-25** Implementar función pura `assembleSpec(registry, converter, options): OpenApiDocument`
- [x] **C-26** Generar `paths` a partir de las rutas registradas
- [ ] **C-27** Generar `components.schemas` deduplicando schemas con nombre (si el adaptador los provee)
- [x] **C-28** Incluir `info`, `servers`, `tags` desde las opciones del builder

### 2.8 `DocBuilder`

- [x] **C-29** Implementar `DocBuilder` como fachada fluida con métodos: `addRoute`, `addRoutes`, `addTag`, `addSecurityScheme`, `addServer`, `build`, `toJSON`
- [x] **C-30** Validar en constructor que `adapter` esté presente

### 2.9 `index.ts` y exports

- [x] **C-31** Exportar desde `index.ts`: `DocBuilder`, `ISchemaAdapter`, `RouteDefinition`, `OpenApiDocument`, `SchemaObject`, todos los errores
- [x] **C-32** Verificar que no hay default exports

---

## 3. Tests unitarios de `@swagger-connect/core`

- [x] **T-01** Tests de `RouteRegistry`: registro correcto, validaciones de path/method/responses, errores esperados
- [x] **T-02** Tests de `SchemaConverter`: delega al adaptador correcto, error si ninguno aplica
- [x] **T-03** Tests de `SpecAssembler`: estructura del documento, paths generados, parámetros, requestBody, responses
- [x] **T-04** Tests de `DocBuilder`: API fluida, `build()` retorna documento válido, `toJSON()` serializa correctamente
- [x] **T-05** Tests de errores: cada clase de error tiene el `code` correcto y el mensaje esperado
- [x] **T-06** Verificar cobertura ≥ 90% en líneas y branches (core: 99% lines / 90.32% branches ✓)

---

## 4. Paquete `@swagger-connect/zod-adapter`

- [x] **Z-01** Crear `packages/zod-adapter/package.json` con `peerDependency: zod >=3.0.0` y `dependency: zod-to-json-schema`
- [x] **Z-02** Crear `packages/zod-adapter/tsconfig.json`
- [x] **Z-03** Configurar `tsup` para ESM + CJS
- [x] **Z-04** Implementar `ZodSchemaAdapter` que implementa `ISchemaAdapter`
  - [x] **Z-04a** `canHandle`: detecta instancias de `ZodType`
  - [x] **Z-04b** `convert`: usa `zodToJsonSchema` y normaliza al tipo `SchemaObject`
  - [x] **Z-04c** Manejo de tipos soportados: string, number, boolean, null, literal, enum, nativeEnum, object, array, union, intersection, optional, nullable, record, tuple, date, any, unknown
  - [-] **Z-04d** Lanzar `OpenApiAdapterError` para tipos no soportados (zod-to-json-schema maneja todos los tipos; el error se lanza para input no-Zod)
- [x] **Z-05** Exportar `ZodSchemaAdapter` desde `index.ts`
- [x] **T-Z-01** Tests: cada tipo de Zod soportado produce el SchemaObject correcto
- [x] **T-Z-02** Tests: tipos no soportados lanzan `OpenApiAdapterError`
- [x] **T-Z-03** Verificar cobertura ≥ 85% (zod-adapter: 92.39% lines / 87.09% branches ✓)

---

## 5. Ejemplo `examples/plain-typescript/`

- [x] **E-01** Crear `examples/plain-typescript/package.json` con dependencia a `@swagger-connect/core` y `@swagger-connect/zod-adapter`
- [x] **E-02** Implementar `src/routes.spec.ts` con al menos 3 rutas (GET, POST, DELETE) usando schemas Zod
- [x] **E-03** Implementar `scripts/generate.ts` que genera `openapi.json`
- [x] **E-04** Verificar que `openapi.json` generado pasa validación con `@apidevtools/swagger-parser`
- [x] **E-05** Documentar cómo ejecutar el ejemplo en el `README.md` del ejemplo

---

## 6. Publicación `0.1.0-alpha`

- [x] **P-01** Configurar Changesets en el monorepo
- [x] **P-02** Crear `.changeset/` inicial con versión `0.1.0-alpha` para `core` y `zod-adapter`
- [x] **P-03** Crear `.github/workflows/publish.yml` para publicación automática desde `main`
- [x] **P-04** Verificar que ambos paquetes tienen `"publishConfig": { "access": "public" }`
- [ ] **P-05** Dry-run de publicación: `pnpm changeset publish --dry-run` _(pendiente: requiere npm token configurado)_
