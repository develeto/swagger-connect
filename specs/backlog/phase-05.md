# Phase 05 — Post v1.0 (Backlog)

> **Objetivo:** Mejoras de DX, soporte extendido de ecosistema y features avanzados post-estabilidad.
> **Duración estimada:** Sin fecha límite — se prioriza según demanda.
> **Prerrequisito:** Phase 04 completada y `1.0.0` publicado.

---

## Estado general

| Métrica | Valor |
|---|---|
| Total tareas | 14 |
| Completadas | 0 |
| En progreso | 0 |
| Pendientes | 14 |

---

## 1. CLI — Modo watch

- [ ] **W-01** Añadir flag `--watch` al comando `generate`
- [ ] **W-02** Observar cambios en el config file y en los archivos de rutas importados usando `chokidar`
- [ ] **W-03** Regenerar la spec automáticamente en cada cambio y mostrar diff en stdout
- [ ] **W-04** Integrar con `@apidevtools/swagger-parser` para validar en caliente y alertar en errores sin interrumpir el watch

---

## 2. Soporte multi-API (multiple config files)

- [ ] **M-01** Permitir que `swagger-connect.config.ts` exporte un array de configuraciones
- [ ] **M-02** Cada configuración genera su propio `openapi.json` de salida
- [ ] **M-03** El comando `generate` procesa todas las configs en paralelo
- [ ] **M-04** Útil para monorepos con múltiples APIs en el mismo repositorio

---

## 3. Adaptador `class-validator` (para NestJS)

- [ ] **CV-01** Crear `packages/class-validator-adapter/`
- [ ] **CV-02** Implementar `ClassValidatorSchemaAdapter` usando reflection para leer decoradores
- [ ] **CV-03** `peerDependency: class-validator >=0.14.0` y `reflect-metadata`
- [ ] **CV-04** Soportar decoradores comunes: `@IsString`, `@IsNumber`, `@IsEmail`, `@IsUUID`, `@IsOptional`, `@IsArray`, `@ValidateNested`, `@IsEnum`
- [ ] **CV-05** Tests y cobertura ≥ 85%

---

## 4. Plugin Vite/Webpack

- [ ] **VP-01** Crear `packages/vite-plugin/` con un plugin de Vite que regenera la spec en HMR
- [ ] **VP-02** El plugin observa los archivos de rutas e invalida el módulo de spec en caliente
- [ ] **VP-03** Documentar integración con Vite y Webpack

---

## 5. Mejoras de calidad general

- [ ] **Q-01** Añadir `@swagger-connect/eslint-plugin` con regla que avisa si una ruta registrada en el router no tiene correspondencia en el `DocBuilder`
- [ ] **Q-02** Publicar documentación en sitio estático (VitePress o Nextra) en GitHub Pages
