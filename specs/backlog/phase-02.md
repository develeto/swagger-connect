# Phase 02 — Joi, Yup & TypeBox Adapters

> **Objetivo:** Soportar los 4 validadores principales y publicar `0.2.0-beta`.
> **Duración estimada:** Semanas 4–5
> **Prerrequisito:** Phase 01 completada y `0.1.0-alpha` publicado.

---

## Estado general

| Métrica | Valor |
|---|---|
| Total tareas | 24 |
| Completadas | 0 |
| En progreso | 0 |
| Pendientes | 24 |

---

## 1. Paquete `@swagger-connect/joi-adapter`

- [ ] **J-01** Crear `packages/joi-adapter/package.json` con `peerDependency: joi >=17.0.0` y `dependency: joi-to-json`
- [ ] **J-02** Crear `packages/joi-adapter/tsconfig.json` y configurar `tsup`
- [ ] **J-03** Implementar `JoiSchemaAdapter` que implementa `ISchemaAdapter`
  - [ ] **J-03a** `canHandle`: detecta schemas Joi (`schema.isJoi === true` o `schema.schemaType`)
  - [ ] **J-03b** `convert`: usa `joi-to-json` con formato `'json-draft-07'` y normaliza a `SchemaObject`
  - [ ] **J-03c** Soportar: string, number, boolean, object, array, alternatives (union), any, date
  - [ ] **J-03d** Lanzar `OpenApiAdapterError` para tipos no soportados
- [ ] **J-04** Exportar `JoiSchemaAdapter` desde `index.ts`
- [ ] **T-J-01** Tests unitarios: cada tipo Joi soportado → SchemaObject correcto
- [ ] **T-J-02** Tests: errores esperados para tipos no soportados
- [ ] **T-J-03** Cobertura ≥ 85%

---

## 2. Paquete `@swagger-connect/yup-adapter`

- [ ] **Y-01** Crear `packages/yup-adapter/package.json` con `peerDependency: yup >=1.0.0`
- [ ] **Y-02** Crear `packages/yup-adapter/tsconfig.json` y configurar `tsup`
- [ ] **Y-03** Implementar `YupSchemaAdapter` que implementa `ISchemaAdapter`
  - [ ] **Y-03a** `canHandle`: detecta schemas Yup por `__isYupSchema__` o `describe()`
  - [ ] **Y-03b** `convert`: usa la API `schema.describe()` de Yup para obtener la descripción y la convierte a `SchemaObject`
  - [ ] **Y-03c** Soportar: string, number, boolean, object, array, mixed, date, lazy (sin soporte, error explícito)
  - [ ] **Y-03d** Lanzar `OpenApiAdapterError` para tipos no soportados o `lazy`
- [ ] **Y-04** Exportar `YupSchemaAdapter` desde `index.ts`
- [ ] **T-Y-01** Tests unitarios: cada tipo Yup soportado → SchemaObject correcto
- [ ] **T-Y-02** Tests: errores esperados
- [ ] **T-Y-03** Cobertura ≥ 85%

---

## 3. Paquete `@swagger-connect/typebox-adapter`

- [ ] **TB-01** Crear `packages/typebox-adapter/package.json` con `peerDependency: @sinclair/typebox >=0.31.0`
- [ ] **TB-02** Crear `packages/typebox-adapter/tsconfig.json` y configurar `tsup`
- [ ] **TB-03** Implementar `TypeBoxSchemaAdapter` que implementa `ISchemaAdapter`
  - [ ] **TB-03a** `canHandle`: detecta schemas TypeBox por símbolo `Kind` de TypeBox (`schema[Symbol.for('TypeBox.Kind')]`)
  - [ ] **TB-03b** `convert`: TypeBox ya produce JSON Schema — normalizar y filtrar propiedades TypeBox-internas (`$schema`, `[Symbol]`) antes de retornar el `SchemaObject`
  - [ ] **TB-03c** Soportar el subset completo de TypeBox (es prácticamente JSON Schema nativo)
- [ ] **TB-04** Exportar `TypeBoxSchemaAdapter` desde `index.ts`
- [ ] **T-TB-01** Tests: schemas TypeBox representativos → SchemaObject correcto
- [ ] **T-TB-02** Tests: propiedades internas de TypeBox eliminadas del output
- [ ] **T-TB-03** Cobertura ≥ 85%

---

## 4. Tests de integración end-to-end

- [ ] **I-01** Crear script `scripts/validate-examples.ts` que genera la spec de cada ejemplo y la valida con `@apidevtools/swagger-parser`
- [ ] **I-02** Crear ejemplo `examples/plain-typescript/` con rutas usando los 4 adaptadores (uno por archivo de ejemplo)
- [ ] **I-03** Integrar `validate-examples.ts` en el pipeline de CI (`ci.yml`)
- [ ] **I-04** Verificar que la spec generada cumple OpenAPI 3.0.x (no 3.1) para máxima compatibilidad con Swagger UI

---

## 5. Documentación de adaptador personalizado

- [ ] **D-01** Crear `docs/custom-adapter.md` con guía paso a paso para implementar `ISchemaAdapter`
- [ ] **D-02** Incluir ejemplo completo de adaptador ficticio (`MySchemaAdapter`)
- [ ] **D-03** Documentar los errores que debe lanzar un adaptador y cuándo
- [ ] **D-04** Añadir sección en `docs/adapters.md` con tabla de adaptadores oficiales y sus peer deps

---

## 6. Publicación `0.2.0-beta`

- [ ] **P-01** Crear changeset `minor` para los 3 nuevos adaptadores
- [ ] **P-02** Actualizar `CHANGELOG.md` de cada paquete
- [ ] **P-03** Publicar bajo tag `beta` en npm
