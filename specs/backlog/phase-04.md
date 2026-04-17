# Phase 04 — CLI & Framework Examples

> **Objetivo:** Herramientas de developer experience completas y ejemplos de integración para los frameworks más populares. Publicación de `1.0.0`.
> **Duración estimada:** Semana 8
> **Prerrequisito:** Phase 03 completada y `0.3.0-beta` publicado.

---

## Estado general

| Métrica | Valor |
|---|---|
| Total tareas | 26 |
| Completadas | 0 |
| En progreso | 0 |
| Pendientes | 26 |

---

## 1. Paquete `swagger-connect` (CLI)

### 1.1 Setup del paquete

- [ ] **CLI-01** Crear `packages/cli/package.json`
  - `name: swagger-connect` (paquete raíz para `npx swagger-connect`)
  - `bin: { "swagger-connect": "./dist/index.js" }`
  - `dependency: @swagger-connect/core`
- [ ] **CLI-02** Crear `packages/cli/tsconfig.json` y configurar `tsup`
- [ ] **CLI-03** Elegir framework de CLI: `commander` o `citty` (preferir el más ligero)

### 1.2 Comando `generate`

- [ ] **CLI-04** Implementar `commands/generate.ts`
  - Flag `--config <path>` — ruta al archivo de configuración (default: `swagger-connect.config.ts`)
  - Flag `--output <path>` — archivo de salida (override del config)
  - Flag `--format json|yaml` — formato de salida (default: `json`)
- [ ] **CLI-05** Cargar el config file con `jiti` o `tsx` para soportar TypeScript directamente
- [ ] **CLI-06** Exportar función `defineConfig(options)` desde el paquete CLI para tipado del config file
- [ ] **CLI-07** Generar la spec y escribir al archivo de salida
- [ ] **CLI-08** Mostrar resumen en stdout: rutas generadas, archivo de salida, tamaño

### 1.3 Comando `validate`

- [ ] **CLI-09** Implementar `commands/validate.ts`
  - Flag `--input <path>` — archivo a validar (JSON o YAML)
  - Flag `--strict` — fallar en warnings además de errores
- [ ] **CLI-10** Usar `@apidevtools/swagger-parser` para validar
- [ ] **CLI-11** Mostrar errores con path exacto dentro del documento y sugerencia de fix
- [ ] **CLI-12** Exit code 0 en éxito, 1 en error de validación

### 1.4 `index.ts` del CLI

- [ ] **CLI-13** Registrar ambos comandos en el programa principal
- [ ] **CLI-14** Mostrar versión con `--version` (tomada de `package.json`)
- [ ] **CLI-15** Mostrar ayuda con `--help`

---

## 2. Tests del CLI

- [ ] **T-CLI-01** Tests de `generate`: config válido → archivo generado con contenido correcto
- [ ] **T-CLI-02** Tests de `generate`: config inválido → error con mensaje descriptivo
- [ ] **T-CLI-03** Tests de `validate`: spec válida → exit 0
- [ ] **T-CLI-04** Tests de `validate`: spec inválida → exit 1 con errores
- [ ] **T-CLI-05** Cobertura ≥ 85%

---

## 3. Ejemplo `examples/basic-express/`

- [ ] **EX-01** App Express con 5 rutas REST (CRUD de usuarios)
- [ ] **EX-02** Usar `ZodSchemaAdapter` para schemas
- [ ] **EX-03** Servir Swagger UI en `/docs` con `swagger-ui-express`
- [ ] **EX-04** Script `generate-spec.ts` que genera `openapi.json`
- [ ] **EX-05** README con instrucciones de ejecución

---

## 4. Ejemplo `examples/basic-fastify/`

- [ ] **EX-06** App Fastify con 5 rutas REST
- [ ] **EX-07** Usar `ZodSchemaAdapter`
- [ ] **EX-08** Registrar spec con `@fastify/swagger` y UI con `@fastify/swagger-ui`
- [ ] **EX-09** README con instrucciones

---

## 5. Ejemplo `examples/nestjs/`

- [ ] **EX-10** App NestJS básica con módulo de usuarios
- [ ] **EX-11** Archivo `routes.spec.ts` con rutas definidas con `@swagger-connect/core`
- [ ] **EX-12** Integración en `main.ts` usando `SwaggerModule.setup`
- [ ] **EX-13** README con instrucciones

---

## 6. Documentación final para v1.0.0

- [ ] **D-01** Completar `docs/getting-started.md` con los 4 frameworks y plain TypeScript
- [ ] **D-02** Completar `docs/api-reference.md`: todos los métodos de `DocBuilder`, tipos públicos, errores
- [ ] **D-03** Completar `docs/adapters.md`: tabla de adaptadores, peer deps, versiones soportadas
- [ ] **D-04** Revisar y completar `README.md` raíz del monorepo con badges (CI, npm, coverage)
- [ ] **D-05** Revisar `README.md` de cada paquete publicado

---

## 7. Preparación y publicación `1.0.0`

- [ ] **P-01** Crear changeset `major` para todos los paquetes (promover de beta a `1.0.0`)
- [ ] **P-02** Revisar que no hay `TODO` ni código de debug en ningún paquete publicado
- [ ] **P-03** Ejecutar pipeline CI completo en verde
- [ ] **P-04** Verificar tamaño de bundles: core < 10 KB gzip, cada adaptador < 5 KB gzip
- [ ] **P-05** Publicar `1.0.0` bajo tag `latest` en npm
- [ ] **P-06** Crear GitHub Release con changelog de todas las fases
