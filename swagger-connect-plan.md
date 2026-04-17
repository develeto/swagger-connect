# swagger-connect — Plan de desarrollo

> Paquete npm para generar documentación OpenAPI 3.x de forma automática desde cualquier proyecto, framework o arquitectura, usando los tipos y schemas que el usuario ya tiene.

---

## Tabla de contenidos

1. [Visión del proyecto](#1-visión-del-proyecto)
2. [Principios no negociables](#2-principios-no-negociables)
3. [Reglas de desarrollo](#3-reglas-de-desarrollo)
4. [Arquitectura del paquete](#4-arquitectura-del-paquete)
5. [Estructura del repositorio](#5-estructura-del-repositorio)
6. [API pública](#6-api-pública)
7. [Adaptadores de schema](#7-adaptadores-de-schema)
8. [Fases de desarrollo](#8-fases-de-desarrollo)
9. [Documentación de integración](#9-documentación-de-integración)
10. [Estándares de calidad](#10-estándares-de-calidad)

---

## 1. Visión del proyecto

**`swagger-connect`** es una librería framework-agnostic que permite a cualquier proyecto Node.js/TypeScript generar una especificación OpenAPI 3.x válida directamente desde los schemas y tipos que ya existen en el código, sin obligar al usuario a adoptar una arquitectura específica ni reescribir su proyecto.

### Qué problema resuelve

- Mantener la documentación de la API sincronizada con el código es manual y propenso a errores.
- Las soluciones existentes son invasivas: requieren decoradores específicos, acoplar el framework o cambiar la arquitectura.
- En proyectos con arquitectura limpia (onion, hexagonal, DDD) o Serverless Framework, llevar Swagger hasta el handler es especialmente complejo.

### Qué NO es este paquete

- No es un framework de validación. Usa los que el usuario ya tiene.
- No genera código a partir de la spec (code-first únicamente).
- No impone ninguna arquitectura al proyecto del usuario.
- No tiene magia implícita: todo comportamiento es opt-in y declarativo.

---

## 2. Principios no negociables

Estos principios gobiernan cada decisión de diseño y cada línea de código del paquete.

### 2.1 Framework-agnostic por contrato

El núcleo (`core`) no importa ningún framework, validador ni librería de terceros. Toda integración ocurre a través de adaptadores que implementan interfaces definidas en el core. Un proyecto Express, un handler de Lambda o una función de Fastify deben poder usar el paquete exactamente de la misma manera.

### 2.2 Bring Your Own Schema (BYOS)

El usuario no necesita aprender una nueva forma de definir tipos. Si ya usa Zod, usa Zod. Si usa Joi, usa Joi. El paquete provee adaptadores oficiales para los validadores más comunes y expone la interfaz `ISchemaAdapter` para que cualquier persona implemente soporte para cualquier otra librería.

### 2.3 Zero side effects

Importar `swagger-connect` no modifica el entorno de ejecución, no registra rutas, no altera prototipos ni ejecuta código automáticamente. Todo es explícito y controlado por el usuario.

### 2.4 TypeScript first

El paquete está escrito en TypeScript con `strict: true`. La API pública está completamente tipada. El tipo `any` está prohibido en el código fuente del paquete (excepto en adaptadores internos donde la interoperabilidad lo exige, siempre documentado).

### 2.5 Composable sobre configuración

Se prefiere la composición de funciones pequeñas sobre objetos de configuración grandes. El usuario puede usar solo las partes que necesita.

---

## 3. Reglas de desarrollo

Estas reglas son obligatorias para todo contribuidor. No son sugerencias.

### 3.1 Reglas de código

| Regla                               | Descripción                                                                                                                        |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **No `any` público**                | El tipo `any` no puede aparecer en ninguna firma pública de función, tipo exportado o interfaz.                                    |
| **No efectos en importación**       | Ningún módulo ejecuta código al ser importado.                                                                                     |
| **Un archivo, una responsabilidad** | Cada archivo exporta un único concepto principal.                                                                                  |
| **Sin dependencias circulares**     | Verificado automáticamente en CI con `madge`.                                                                                      |
| **Exports nombrados únicamente**    | No se usan default exports en el código fuente. La razón: los default exports dificultan el tree-shaking y el renaming automático. |
| **Funciones puras en el core**      | Todas las funciones del paquete `core` son puras (sin estado mutable, sin I/O).                                                    |
| **Errores explícitos**              | Nunca se lanza un error genérico `new Error('something failed')`. Cada error tiene un tipo, un código y un mensaje descriptivo.    |

### 3.2 Reglas de estructura

- El directorio `core` no puede tener dependencias en `package.json` más allá de TypeScript.
- Los adaptadores (`zod-adapter`, `joi-adapter`, etc.) solo dependen de `core` y de su librería objetivo.
- El plugin de Serverless Framework solo depende de `core`.
- Ningún paquete del monorepo puede importar desde otro paquete usando rutas relativas. Solo a través del nombre del paquete (`@swagger-connect/core`).

### 3.3 Reglas de testing

- **Cobertura mínima del core: 90%** de líneas y branches.
- **Cobertura mínima de adaptadores: 85%**.
- Cada función pública debe tener al menos un test de caso feliz y uno de caso de error.
- Los tests no deben depender de orden de ejecución ni de estado compartido entre ellos.
- Los tests de integración se ejecutan contra código compilado (no contra el source TypeScript).

### 3.4 Reglas de versionado

- Se usa **Semantic Versioning** estrictamente.
- Un cambio en una interfaz pública del `core` es siempre un **breaking change** (major).
- Un nuevo adaptador oficial es un **minor**.
- Un bug fix es un **patch**.
- El changelog se actualiza con cada PR usando **Conventional Commits** (`feat:`, `fix:`, `docs:`, `chore:`, `BREAKING CHANGE:`).

### 3.5 Reglas de pull request

- Todo PR requiere al menos un revisor.
- Todo PR que modifique la API pública debe incluir actualización de la documentación en el mismo commit.
- No se hace merge si algún test falla o si la cobertura baja del umbral.
- No se hace merge si `tsc --noEmit` reporta errores.

---

## 4. Arquitectura del paquete

El paquete se organiza en capas con dependencias unidireccionales. Una capa solo puede depender de las capas que están por debajo de ella, nunca hacia arriba.

```
┌─────────────────────────────────────────────────┐
│              Código del usuario                  │
│  (handlers, controllers, rutas, lambdas, etc.)   │
└───────────────────┬─────────────────────────────┘
                    │ usa
┌───────────────────▼─────────────────────────────┐
│           Adaptadores de framework               │
│  serverless-plugin │ express │ fastify │ manual  │
└───────────────────┬─────────────────────────────┘
                    │ usa
┌───────────────────▼─────────────────────────────┐
│                   Core                           │
│   DocBuilder │ RouteRegistry │ SpecAssembler     │
└───────────────────┬─────────────────────────────┘
                    │ usa
┌───────────────────▼─────────────────────────────┐
│           Adaptadores de schema                  │
│    zod │ joi │ yup │ typebox │ ISchemaAdapter    │
└─────────────────────────────────────────────────┘
```

### Componentes del core

**`RouteRegistry`** — Registro en memoria de rutas documentadas. El usuario (o el adaptador de framework) registra rutas con sus schemas. Es un Map inmutable una vez construido.

**`SchemaConverter`** — Recibe un schema de cualquier adaptador registrado y devuelve un objeto JSON Schema / OpenAPI Schema Object. Stateless.

**`SpecAssembler`** — Toma el RouteRegistry completo y produce el documento OpenAPI 3.x final como un objeto JavaScript plano. Stateless y puro.

**`DocBuilder`** — Fachada pública del core. Orquesta los tres componentes anteriores con una API fluida y simple.

---

## 5. Estructura del repositorio

```
swagger-connect/
├── packages/
│   ├── core/                          # @swagger-connect/core
│   │   ├── src/
│   │   │   ├── adapters/
│   │   │   │   └── ISchemaAdapter.ts  # Interfaz pública para adaptadores
│   │   │   ├── builder/
│   │   │   │   ├── DocBuilder.ts
│   │   │   │   ├── RouteRegistry.ts
│   │   │   │   └── SpecAssembler.ts
│   │   │   ├── errors/
│   │   │   │   └── OpenApiError.ts
│   │   │   ├── types/
│   │   │   │   └── openapi.types.ts   # Tipos OpenAPI 3.x (sin dependencias externas)
│   │   │   └── index.ts
│   │   ├── test/
│   │   └── package.json
│   │
│   ├── zod-adapter/                   # @swagger-connect/zod-adapter
│   │   ├── src/
│   │   │   ├── ZodSchemaAdapter.ts
│   │   │   └── index.ts
│   │   ├── test/
│   │   └── package.json
│   │
│   ├── joi-adapter/                   # @swagger-connect/joi-adapter
│   ├── yup-adapter/                   # @swagger-connect/yup-adapter
│   ├── typebox-adapter/               # @swagger-connect/typebox-adapter
│   │
│   ├── serverless-plugin/             # @swagger-connect/serverless-plugin
│   │   ├── src/
│   │   │   ├── ServerlessPlugin.ts
│   │   │   ├── YmlRouteCollector.ts   # Lee serverless.yml
│   │   │   └── index.ts
│   │   ├── test/
│   │   └── package.json
│   │
│   └── cli/                           # swagger-connect (CLI)
│       ├── src/
│       │   ├── commands/
│       │   │   ├── generate.ts
│       │   │   └── validate.ts
│       │   └── index.ts
│       └── package.json
│
├── examples/
│   ├── basic-express/
│   ├── basic-fastify/
│   ├── serverless-framework/
│   ├── nestjs/
│   └── plain-typescript/              # Sin framework, integración manual
│
├── docs/
│   ├── getting-started.md
│   ├── adapters.md
│   ├── custom-adapter.md
│   └── api-reference.md
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── publish.yml
│
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

**Herramientas del monorepo:**

- **pnpm workspaces** para gestión de dependencias
- **Turborepo** para builds y tests incrementales
- **Vitest** para testing
- **tsup** para compilación y bundling
- **Changesets** para gestión de versiones y changelog

---

## 6. API pública

La API está diseñada para ser aprendida en menos de 10 minutos.

### 6.1 Uso básico (framework-agnostic, manual)

```typescript
import { DocBuilder } from "@swagger-connect/core";
import { ZodSchemaAdapter } from "@swagger-connect/zod-adapter";
import { z } from "zod";

// 1. Definir schemas con Zod (o cualquier otro validador soportado)
const CreateUserBody = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

const UserResponse = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string(),
});

// 2. Construir el documento OpenAPI
const spec = new DocBuilder({
  info: {
    title: "Mi API",
    version: "1.0.0",
  },
  adapter: new ZodSchemaAdapter(),
})
  .addRoute({
    method: "POST",
    path: "/users",
    summary: "Crear un usuario",
    tags: ["Users"],
    requestBody: CreateUserBody,
    responses: {
      201: UserResponse,
      400: z.object({ message: z.string() }),
    },
  })
  .addRoute({
    method: "GET",
    path: "/users/{id}",
    summary: "Obtener un usuario",
    tags: ["Users"],
    pathParams: z.object({ id: z.string().uuid() }),
    responses: {
      200: UserResponse,
      404: z.object({ message: z.string() }),
    },
  })
  .build(); // Devuelve el objeto OpenAPI 3.x completo

// 3. Usar la spec como se necesite: guardar en archivo, servir en endpoint, etc.
console.log(JSON.stringify(spec, null, 2));
```

### 6.2 Interfaz `DocBuilder`

```typescript
class DocBuilder {
  constructor(options: DocBuilderOptions);

  addRoute(route: RouteDefinition): this;
  addRoutes(routes: RouteDefinition[]): this;
  addTag(tag: TagObject): this;
  addSecurityScheme(name: string, scheme: SecuritySchemeObject): this;
  addServer(server: ServerObject): this;

  build(): OpenApiDocument; // Devuelve el objeto completo
  toJSON(): string; // JSON string indentado
  toYAML(): string; // YAML string (requiere js-yaml como peer dep)
}
```

### 6.3 Tipo `RouteDefinition`

```typescript
interface RouteDefinition {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
  path: string; // Formato OpenAPI: /users/{id}
  summary?: string;
  description?: string;
  tags?: string[];
  operationId?: string;
  deprecated?: boolean;
  security?: SecurityRequirementObject[];

  pathParams?: AnySchema; // Schema del adaptador registrado
  queryParams?: AnySchema;
  headers?: AnySchema;
  requestBody?: AnySchema;
  responses: Record<number, AnySchema | ResponseObject>;
}
```

### 6.4 Interfaz `ISchemaAdapter`

Esta es la interfaz que cualquiera puede implementar para soportar un validador personalizado:

```typescript
interface ISchemaAdapter {
  /**
   * Nombre del adaptador. Usado en mensajes de error.
   */
  readonly name: string;

  /**
   * Determina si este adaptador puede manejar el schema dado.
   * Permite múltiples adaptadores registrados en paralelo.
   */
  canHandle(schema: unknown): boolean;

  /**
   * Convierte el schema a un OpenAPI Schema Object.
   * Debe lanzar OpenApiAdapterError si la conversión falla.
   */
  convert(schema: unknown): SchemaObject;
}
```

---

## 7. Adaptadores de schema

### 7.1 `@swagger-connect/zod-adapter`

Convierte schemas de Zod a OpenAPI Schema Object. Usa `zod-to-json-schema` internamente como dependencia de producción.

**Tipos de Zod soportados en v1:**
`z.string()`, `z.number()`, `z.boolean()`, `z.null()`, `z.undefined()`, `z.literal()`, `z.enum()`, `z.nativeEnum()`, `z.object()`, `z.array()`, `z.union()`, `z.intersection()`, `z.optional()`, `z.nullable()`, `z.record()`, `z.tuple()`, `z.date()` (como string ISO), `z.any()`, `z.unknown()`.

**Uso:**

```typescript
import { ZodSchemaAdapter } from "@swagger-connect/zod-adapter";
const adapter = new ZodSchemaAdapter();
```

### 7.2 `@swagger-connect/joi-adapter`

Convierte schemas de Joi. Usa `joi-to-json` internamente.

```typescript
import { JoiSchemaAdapter } from "@swagger-connect/joi-adapter";
const adapter = new JoiSchemaAdapter();
```

### 7.3 `@swagger-connect/yup-adapter`

Convierte schemas de Yup. Usa la API `describe()` de Yup internamente.

```typescript
import { YupSchemaAdapter } from "@swagger-connect/yup-adapter";
const adapter = new YupSchemaAdapter();
```

### 7.4 `@swagger-connect/typebox-adapter`

Convierte schemas de TypeBox. TypeBox ya produce JSON Schema directamente, por lo que este adaptador es una capa delgada de validación y normalización.

```typescript
import { TypeBoxSchemaAdapter } from "@swagger-connect/typebox-adapter";
const adapter = new TypeBoxSchemaAdapter();
```

### 7.5 Implementar un adaptador personalizado

```typescript
import type { ISchemaAdapter, SchemaObject } from "@swagger-connect/core";

export class MyCustomAdapter implements ISchemaAdapter {
  readonly name = "my-custom-adapter";

  canHandle(schema: unknown): boolean {
    // Retorna true si este schema es del tipo que soportas
    return schema instanceof MySchemaClass;
  }

  convert(schema: unknown): SchemaObject {
    // Convierte a un OpenAPI Schema Object plano
    const s = schema as MySchemaClass;
    return {
      type: "object",
      properties: {
        /* ... */
      },
    };
  }
}
```

---

## 8. Fases de desarrollo

### Fase 1 — Core y adaptador Zod (semanas 1–3)

**Objetivo:** Tener un paquete funcional y publicado como `0.1.0-alpha` que permita generar una spec OpenAPI básica con Zod.

Tareas:

- Inicializar el monorepo con pnpm + Turborepo
- Crear `@swagger-connect/core` con `DocBuilder`, `RouteRegistry`, `SpecAssembler`
- Definir y documentar la interfaz `ISchemaAdapter`
- Crear `@swagger-connect/zod-adapter`
- Tests unitarios del core con cobertura ≥ 90%
- Ejemplo funcional en `examples/plain-typescript/`
- Publicar en npm bajo el tag `alpha`

**Criterio de éxito:** El ejemplo en `examples/plain-typescript/` genera un `openapi.json` válido que Swagger UI puede renderizar sin errores.

### Fase 2 — Adaptadores Joi, Yup y TypeBox (semanas 4–5)

**Objetivo:** Soportar los 4 validadores principales.

Tareas:

- Crear `@swagger-connect/joi-adapter`, `@swagger-connect/yup-adapter`, `@swagger-connect/typebox-adapter`
- Tests de integración que validan la spec generada contra el estándar OpenAPI 3.x usando `@apidevtools/swagger-parser`
- Documentar cómo implementar un adaptador personalizado
- Publicar `0.2.0-beta`

### Fase 3 — Plugin Serverless Framework (semanas 6–7)

**Objetivo:** Integración de primera clase con Serverless Framework.

Tareas:

- Crear `@swagger-connect/serverless-plugin`
- El plugin lee las funciones de `serverless.yml` y las cruza con los schemas registrados en los handlers
- Hook en `before:package:initialize` para generar la spec antes del deploy
- Opción `serve: true` que expone `/swagger` y `/swagger.json` en `serverless-offline`
- Opción `s3Upload: true` para subir la spec a S3 en deploy
- Ejemplo en `examples/serverless-framework/`
- Publicar `0.3.0-beta`

### Fase 4 — CLI y ejemplos de frameworks (semana 8)

**Objetivo:** Herramientas de developer experience y ejemplos de integración completos.

Tareas:

- CLI `npx swagger-connect generate` que genera la spec a partir de un archivo de configuración
- CLI `npx swagger-connect validate` que valida una spec existente
- Ejemplos completos para Express, Fastify y NestJS
- Publicar `1.0.0`

### Fase 5 — Post v1.0 (backlog)

- Modo `--watch` en la CLI para regenerar la spec en desarrollo
- Soporte para múltiples archivos de configuración (multi-API)
- Adaptador para `class-validator` (popular en NestJS)
- Plugin para Vite/Webpack que regenera la spec en cambios del código

---

## 9. Documentación de integración

### 9.1 Instalación

```bash
# Con npm
npm install @swagger-connect/core

# Con pnpm
pnpm add @swagger-connect/core

# Con yarn
yarn add @swagger-connect/core
```

Instalar el adaptador para el validador que ya usas en tu proyecto:

```bash
# Elige uno (o más de uno si usas varios)
npm install @swagger-connect/zod-adapter
npm install @swagger-connect/joi-adapter
npm install @swagger-connect/yup-adapter
npm install @swagger-connect/typebox-adapter
```

> Los validadores (`zod`, `joi`, etc.) son `peerDependencies`. No se instalan automáticamente. Debes tener instalado el validador que ya usas en tu proyecto.

---

### 9.2 Integración con Express

```typescript
import express from "express";
import { DocBuilder } from "@swagger-connect/core";
import { ZodSchemaAdapter } from "@swagger-connect/zod-adapter";
import { z } from "zod";
import swaggerUi from "swagger-ui-express";

const app = express();
app.use(express.json());

// Definir schemas
const CreateProductBody = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
});

// Construir la spec
const spec = new DocBuilder({
  info: { title: "Products API", version: "1.0.0" },
  adapter: new ZodSchemaAdapter(),
})
  .addRoute({
    method: "POST",
    path: "/products",
    summary: "Crear producto",
    tags: ["Products"],
    requestBody: CreateProductBody,
    responses: { 201: z.object({ id: z.string() }) },
  })
  .build();

// Servir Swagger UI
app.use("/docs", swaggerUi.serve, swaggerUi.setup(spec));

// Tus rutas normales — sin ningún acoplamiento al paquete
app.post("/products", (req, res) => {
  res.status(201).json({ id: "abc-123" });
});

app.listen(3000);
```

---

### 9.3 Integración con Fastify

```typescript
import Fastify from "fastify";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import { DocBuilder } from "@swagger-connect/core";
import { ZodSchemaAdapter } from "@swagger-connect/zod-adapter";
import { z } from "zod";

const app = Fastify();

const spec = new DocBuilder({
  info: { title: "My API", version: "1.0.0" },
  adapter: new ZodSchemaAdapter(),
})
  .addRoute({
    method: "GET",
    path: "/health",
    summary: "Health check",
    responses: { 200: z.object({ status: z.string() }) },
  })
  .build();

// Registrar la spec generada en Fastify
await app.register(fastifySwagger, { openapi: spec });
await app.register(fastifySwaggerUi, { routePrefix: "/docs" });

app.get("/health", async () => ({ status: "ok" }));

await app.listen({ port: 3000 });
```

---

### 9.4 Integración con Serverless Framework

**Instalar el plugin:**

```bash
npm install @swagger-connect/serverless-plugin --save-dev
```

**Configurar `serverless.yml`:**

```yaml
service: my-api

plugins:
  - "@swagger-connect/serverless-plugin"

custom:
  openapiAny:
    info:
      title: My Serverless API
      version: 1.0.0
    outputFile: .build/openapi.json # Archivo de salida local
    serve: true # Sirve /docs en serverless-offline
    s3:
      bucket: my-docs-bucket # Sube la spec a S3 en deploy
      key: api/openapi.json

functions:
  createUser:
    handler: src/handlers/users.create
    events:
      - http:
          method: POST
          path: /users
```

**En el handler:**

```typescript
import { z } from "zod";
import { defineRoute } from "@swagger-connect/serverless-plugin";

// defineRoute es decorativo: solo registra la ruta en el collector
// No modifica el comportamiento del handler en runtime
export const create = defineRoute({
  summary: "Crear usuario",
  tags: ["Users"],
  body: z.object({ name: z.string(), email: z.string().email() }),
  responses: {
    201: z.object({ id: z.string().uuid() }),
  },
})(async (event) => {
  // Lógica del handler — completamente normal, sin acoplamiento
  return {
    statusCode: 201,
    body: JSON.stringify({ id: "generated-id" }),
  };
});
```

---

### 9.5 Integración con NestJS

```typescript
// main.ts
import { NestFactory } from "@nestjs/core";
import { SwaggerModule } from "@nestjs/swagger";
import { DocBuilder } from "@swagger-connect/core";
import { ZodSchemaAdapter } from "@swagger-connect/zod-adapter";
import { AppModule } from "./app.module";
import { appRoutes } from "./routes.spec"; // Archivo donde defines tus rutas

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const spec = new DocBuilder({
    info: { title: "NestJS API", version: "1.0.0" },
    adapter: new ZodSchemaAdapter(),
  })
    .addRoutes(appRoutes)
    .build();

  SwaggerModule.setup("docs", app, spec);

  await app.listen(3000);
}

bootstrap();
```

---

### 9.6 Sin framework (TypeScript puro)

Para generación de archivos en CI/CD o scripts de build:

```typescript
// scripts/generate-spec.ts
import { writeFileSync } from "fs";
import { DocBuilder } from "@swagger-connect/core";
import { ZodSchemaAdapter } from "@swagger-connect/zod-adapter";
import { routes } from "../src/routes.spec";

const spec = new DocBuilder({
  info: {
    title: "My API",
    version: process.env.npm_package_version ?? "1.0.0",
  },
  adapter: new ZodSchemaAdapter(),
})
  .addRoutes(routes)
  .build();

writeFileSync("./openapi.json", JSON.stringify(spec, null, 2));
console.log("openapi.json generado correctamente");
```

Ejecutar con:

```bash
npx ts-node scripts/generate-spec.ts
# o con tsx:
npx tsx scripts/generate-spec.ts
```

---

### 9.7 CLI

```bash
# Generar la spec
npx swagger-connect generate --config swagger-connect.config.ts --output openapi.json

# Validar una spec existente
npx swagger-connect validate --input openapi.json
```

**Archivo de configuración `swagger-connect.config.ts`:**

```typescript
import { defineConfig } from "swagger-connect";
import { ZodSchemaAdapter } from "@swagger-connect/zod-adapter";
import { routes } from "./src/routes.spec";

export default defineConfig({
  info: {
    title: "My API",
    version: "1.0.0",
  },
  adapter: new ZodSchemaAdapter(),
  routes,
  output: "./openapi.json",
});
```

---

## 10. Estándares de calidad

### 10.1 CI/CD obligatorio

Cada PR debe pasar el siguiente pipeline antes de hacer merge:

```yaml
# .github/workflows/ci.yml (referencia simplificada)
steps:
  - name: Type check
    run: pnpm tsc --noEmit

  - name: Lint
    run: pnpm eslint .

  - name: Circular dependency check
    run: pnpm madge --circular packages/

  - name: Tests
    run: pnpm turbo test

  - name: Coverage check
    run: pnpm vitest run --coverage
    # Falla si core < 90% o adaptadores < 85%

  - name: Build
    run: pnpm turbo build

  - name: Validate generated examples
    run: pnpm tsx scripts/validate-examples.ts
    # Genera la spec de cada ejemplo y la valida con swagger-parser
```

### 10.2 Compatibilidad

- Node.js: `>=18.0.0`
- TypeScript: `>=5.0.0`
- El paquete se publica en formato ESM y CJS para máxima compatibilidad.

### 10.3 Peer dependencies declaradas

Cada adaptador declara su validador como `peerDependency` con el rango de versiones soportado:

```json
{
  "peerDependencies": {
    "zod": ">=3.0.0"
  },
  "peerDependenciesMeta": {
    "zod": { "optional": false }
  }
}
```

### 10.4 Tamaño del bundle

- `@swagger-connect/core` debe pesar menos de **10 KB** minificado y comprimido (gzip).
- Cada adaptador debe pesar menos de **5 KB** sin contar su peer dependency.
- Medido automáticamente en CI con `bundlesize` o `size-limit`.

---

_Este documento es el contrato de desarrollo del proyecto `swagger-connect`. Cualquier cambio de arquitectura, interfaz pública o regla de desarrollo debe reflejarse aquí antes de implementarse._
