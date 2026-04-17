# Phase 03 — Serverless Framework Plugin

> **Objetivo:** Integración de primera clase con Serverless Framework: leer `serverless.yml`, cruzar con schemas de handlers y generar/servir/subir la spec automáticamente.
> **Duración estimada:** Semanas 6–7
> **Prerrequisito:** Phase 02 completada y `0.2.0-beta` publicado.

---

## Estado general

| Métrica | Valor |
|---|---|
| Total tareas | 22 |
| Completadas | 0 |
| En progreso | 0 |
| Pendientes | 22 |

---

## 1. Paquete `@swagger-connect/serverless-plugin`

### 1.1 Setup del paquete

- [ ] **S-01** Crear `packages/serverless-plugin/package.json`
  - `peerDependency: serverless >=3.0.0`
  - `dependency: @swagger-connect/core`
  - `devDependency: serverless` (para tipos)
- [ ] **S-02** Crear `packages/serverless-plugin/tsconfig.json` y configurar `tsup`
- [ ] **S-03** Declarar el plugin en `package.json` con el campo `main` apuntando al CJS output (Serverless Framework no soporta ESM plugins)

### 1.2 `YmlRouteCollector`

- [ ] **S-04** Implementar `YmlRouteCollector` que lee el objeto de configuración de Serverless Framework (no el archivo directamente — Serverless lo parsea y lo pasa al plugin)
- [ ] **S-05** Extraer funciones con eventos `http` o `httpApi` y mapear a `RouteDefinition` parcial (sin schemas — los schemas vienen de los handlers)
- [ ] **S-06** Soportar eventos de tipo `http` (REST API) y `httpApi` (HTTP API v2)
- [ ] **S-07** Manejar el formato de path de Serverless (`/users/{id}`) → validar que ya es compatible con OpenAPI

### 1.3 `defineRoute` helper

- [ ] **S-08** Implementar la función `defineRoute(options)(handler)` como higher-order function
- [ ] **S-09** `defineRoute` debe registrar los metadatos en un collector global (module-level singleton, lazy init)
- [ ] **S-10** En producción (cuando Serverless no está en play), `defineRoute` es transparente: retorna el handler sin modificación
- [ ] **S-11** Exportar `defineRoute` desde `index.ts`

### 1.4 `ServerlessPlugin`

- [ ] **S-12** Implementar la clase `ServerlessPlugin` que Serverless Framework instancia
- [ ] **S-13** Registrar hooks:
  - [ ] **S-13a** `before:package:initialize` → generar y guardar `openapi.json` en `outputFile`
  - [ ] **S-13b** `before:offline:start:init` → si `serve: true`, registrar endpoint `/swagger` y `/swagger.json` en serverless-offline
- [ ] **S-14** Leer configuración desde `serverless.yml` bajo `custom.openapiAny`:
  - `info` (title, version)
  - `outputFile` (ruta de salida del archivo)
  - `serve` (boolean)
  - `s3.bucket` y `s3.key` (upload a S3)
- [ ] **S-15** Cruzar rutas del `YmlRouteCollector` con schemas del `defineRoute` collector
- [ ] **S-16** Usar `DocBuilder` del core para ensamblar la spec final
- [ ] **S-17** Si `s3Upload: true`, subir el archivo a S3 usando el SDK de AWS (ya disponible en el entorno Lambda/Serverless)

---

## 2. Tests del plugin

- [ ] **T-S-01** Tests de `YmlRouteCollector`: parseo de eventos http y httpApi, extracción correcta de path/method
- [ ] **T-S-02** Tests de `defineRoute`: el helper retorna el handler original sin modificación, registra metadatos correctamente
- [ ] **T-S-03** Tests de `ServerlessPlugin`: mock de la API de Serverless, verificar hooks registrados
- [ ] **T-S-04** Test de integración: stack Serverless fake → spec generada → validación con swagger-parser
- [ ] **T-S-05** Cobertura ≥ 85%

---

## 3. Ejemplo `examples/serverless-framework/`

- [ ] **E-01** Crear ejemplo con 3 funciones Lambda (createUser, getUser, deleteUser)
- [ ] **E-02** Configurar `serverless.yml` con el plugin y `custom.openapiAny`
- [ ] **E-03** Mostrar uso de `defineRoute` en cada handler
- [ ] **E-04** Documentar cómo ejecutar localmente con `serverless-offline`
- [ ] **E-05** Verificar que el ejemplo genera una spec válida en CI

---

## 4. Documentación

- [ ] **D-01** Crear/actualizar `docs/getting-started.md` con sección Serverless Framework
- [ ] **D-02** Documentar todas las opciones de `custom.openapiAny` en `docs/adapters.md`

---

## 5. Publicación `0.3.0-beta`

- [ ] **P-01** Crear changeset `minor` para `serverless-plugin`
- [ ] **P-02** Actualizar `CHANGELOG.md`
- [ ] **P-03** Publicar bajo tag `beta` en npm
