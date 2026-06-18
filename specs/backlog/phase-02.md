# Phase 02 — Joi, Yup & TypeBox Adapters

> **Objetivo:** Soportar los 4 validadores principales y publicar `0.2.0-beta`.
> **Duración estimada:** Semanas 4–5
> **Prerrequisito:** Phase 01 completada y `0.1.0-alpha` publicado.

---

## Estado general

| Métrica | Valor |
|---|---|---|
| Total tareas | 24 |
| Completadas | 17 |
| En progreso | 0 |
| Pendientes | 7 |

---

## 1. Paquete `@swagger-connect/joi-adapter`

- [x] **J-01** Crear `packages/joi-adapter/package.json` con `peerDependency: joi >=17.0.0` (usa `describe()` API en lugar de `joi-to-json`)
- [x] **J-02** Crear `packages/joi-adapter/tsconfig.json` y configurar `tsup`
- [x] **J-03** Implementar `JoiSchemaAdapter` que implementa `ISchemaAdapter`
  - [x] **J-03a** `canHandle`: detecta schemas Joi por `describe()` method + tipo
  - [x] **J-03b** `convert`: usa Joi `describe()` API y mapea a `SchemaObject`
  - [x] **J-03c** Soportar: string, number, boolean, object, array, alternatives (union), any, date
  - [x] **J-03d** Lanzar `OpenApiAdapterError` para tipos no soportados
- [x] **J-04** Exportar `JoiSchemaAdapter` desde `index.ts`
- [x] **T-J-01** Tests unitarios: cada tipo Joi soportado → SchemaObject correcto
- [x] **T-J-02** Tests: errores esperados para tipos no soportados
- [x] **T-J-03** Cobertura ≥ 85%

---

## 2. Paquete `@swagger-connect/yup-adapter`

- [x] **Y-01** Crear `packages/yup-adapter/package.json` con `peerDependency: yup >=1.0.0`
- [x] **Y-02** Crear `packages/yup-adapter/tsconfig.json` y configurar `tsup`
- [x] **Y-03** Implementar `YupSchemaAdapter` que implementa `ISchemaAdapter`
  - [x] **Y-03a** `canHandle`: detecta schemas Yup por método `describe()` + tipo
  - [x] **Y-03b** `convert`: usa la API `schema.describe()` de Yup y mapea a `SchemaObject`
  - [x] **Y-03c** Soportar: string, number, boolean, object, array, mixed, date, lazy (error explícito)
  - [x] **Y-03d** Lanzar `OpenApiAdapterError` para tipos no soportados o `lazy`
- [x] **Y-04** Exportar `YupSchemaAdapter` desde `index.ts`
- [x] **T-Y-01** Tests unitarios: cada tipo Yup soportado → SchemaObject correcto
- [x] **T-Y-02** Tests: errores esperados
- [x] **T-Y-03** Cobertura ≥ 85%

---

## 3. Paquete `@swagger-connect/typebox-adapter`

- [x] **TB-01** Crear `packages/typebox-adapter/package.json` con `peerDependency: @sinclair/typebox >=0.31.0`
- [x] **TB-02** Crear `packages/typebox-adapter/tsconfig.json` y configurar `tsup`
- [x] **TB-03** Implementar `TypeBoxSchemaAdapter` que implementa `ISchemaAdapter`
  - [x] **TB-03a** `canHandle`: detecta schemas TypeBox por símbolo `Kind` de TypeBox
  - [x] **TB-03b** `convert`: normaliza JSON Schema nativo de TypeBox, filtra propiedades internas
  - [x] **TB-03c** Soportar el subset completo de TypeBox
- [x] **TB-04** Exportar `TypeBoxSchemaAdapter` desde `index.ts`
- [x] **T-TB-01** Tests: schemas TypeBox representativos → SchemaObject correcto
- [x] **T-TB-02** Tests: propiedades internas de TypeBox eliminadas del output
- [x] **T-TB-03** Cobertura ≥ 85%

---

## 4. Tests de integración end-to-end

- [ ] **I-01** Crear script `scripts/validate-examples.ts` que genera la spec de cada ejemplo y la valida con `@apidevtools/swagger-parser`
- [ ] **I-02** Crear ejemplo `examples/plain-typescript/` con rutas usando los 4 adaptadores (uno por archivo de ejemplo)
- [ ] **I-03** Integrar `validate-examples.ts` en el pipeline de CI (`ci.yml`)
- [ ] **I-04** Verificar que la spec generada cumple OpenAPI 3.0.x (no 3.1) para máxima compatibilidad con Swagger UI

---

## 5. Documentación de adaptador personalizado

- [x] **D-01** Crear `docs/custom-adapter.md` con guía paso a paso para implementar `ISchemaAdapter`
- [x] **D-02** Incluir ejemplo completo de adaptador ficticio (`MyCustomAdapter`)
- [x] **D-03** Documentar los errores que debe lanzar un adaptador y cuándo
- [x] **D-04** Añadir sección en `docs/adapters.md` con tabla de adaptadores oficiales y sus peer deps

---

## 6. Publicación `0.2.0-beta`

- [ ] **P-01** Crear changeset `minor` para los 3 nuevos adaptadores
- [ ] **P-02** Actualizar `CHANGELOG.md` de cada paquete
- [ ] **P-03** Publicar bajo tag `beta` en npm
