# specs/

Este directorio centraliza toda la documentación de contexto, decisiones de arquitectura y control de progreso del proyecto `swagger-connect`.

## Contenido

| Carpeta / Archivo | Descripción |
|---|---|
| `backlog/` | Estimación y seguimiento de tareas por fase de desarrollo |
| `decisions/` | Architecture Decision Records (ADRs) — decisiones importantes y su justificación |
| `contracts/` | Contratos de interfaz pública detallados (cuando la complejidad lo justifique) |

## Cómo usar el backlog

Cada archivo `backlog/phase-XX.md` representa una fase del plan de desarrollo.  
Los estados posibles de cada tarea son:

| Estado | Significado |
|---|---|
| `[ ]` | Pendiente — no iniciada |
| `[~]` | En progreso |
| `[x]` | Completada |
| `[!]` | Bloqueada — requiere acción externa |
| `[-]` | Descartada — ya no aplica |

Actualiza el estado de cada tarea a medida que avanza el desarrollo.
