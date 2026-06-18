# Creating a custom schema adapter

swagger-connect is designed to work with any schema validation library. If your library isn't officially supported, you can create a custom adapter by implementing the `ISchemaAdapter` interface.

## Interface

```typescript
interface ISchemaAdapter {
  readonly name: string;
  canHandle(schema: unknown): boolean;
  convert(schema: unknown): SchemaObject;
}
```

### `name`
A human-readable name used in error messages (e.g., `'my-custom-adapter'`).

### `canHandle(schema)`
Return `true` if this adapter can convert the given schema. This allows multiple adapters to coexist — the first matching adapter wins.

### `convert(schema)`
Convert the schema to an [OpenAPI 3.x Schema Object](https://spec.openapis.org/oas/v3.0.3#schema-object). Must throw `OpenApiAdapterError` on failure.

## Full example

```typescript
import type { ISchemaAdapter, SchemaObject } from '@swagger-connect/core';
import { OpenApiAdapterError } from '@swagger-connect/core';

// Hypothetical validation library
class MySchema {
  constructor(public type: string, public rules?: Record<string, unknown>) {}
}

export class MyCustomAdapter implements ISchemaAdapter {
  readonly name = 'my-custom-adapter';

  canHandle(schema: unknown): boolean {
    return schema instanceof MySchema;
  }

  convert(schema: unknown): SchemaObject {
    if (!(schema instanceof MySchema)) {
      throw new OpenApiAdapterError(
        'Expected a MySchema instance',
        this.name,
      );
    }

    try {
      const result: SchemaObject = { type: schema.type as SchemaObject['type'] };

      if (schema.rules?.min !== undefined) {
        result.minLength = schema.rules.min as number;
      }
      if (schema.rules?.max !== undefined) {
        result.maxLength = schema.rules.max as number;
      }

      return result;
    } catch (err) {
      throw new OpenApiAdapterError(
        `Conversion failed: ${(err as Error).message}`,
        this.name,
      );
    }
  }
}
```

## Error handling

Always throw `OpenApiAdapterError` (not a generic `Error`) so that the core can provide meaningful error messages to the user:

```typescript
import { OpenApiAdapterError } from '@swagger-connect/core';

throw new OpenApiAdapterError(
  'Descriptive error message about what went wrong',
  this.name,  // adapter name
);
```

## Registering with DocBuilder

```typescript
import { DocBuilder } from '@swagger-connect/core';
import { MyCustomAdapter } from './MyCustomAdapter';

const spec = new DocBuilder({
  info: { title: 'My API', version: '1.0.0' },
  adapter: new MyCustomAdapter(),
}).build();
```

You can also combine multiple adapters:

```typescript
const spec = new DocBuilder({
  info: { title: 'My API', version: '1.0.0' },
  adapter: new ZodSchemaAdapter(),
})
  .addAdapter(new MyCustomAdapter())
  .build();
```

## Testing your adapter

```typescript
import { describe, it, expect } from 'vitest';
import { MyCustomAdapter } from './MyCustomAdapter';
import { OpenApiAdapterError } from '@swagger-connect/core';

const adapter = new MyCustomAdapter();

it('converts a simple schema', () => {
  const result = adapter.convert(new MySchema('string', { min: 1 }));
  expect(result.type).toBe('string');
  expect(result.minLength).toBe(1);
});

it('throws on invalid input', () => {
  expect(() => adapter.convert('not-a-schema')).toThrow(OpenApiAdapterError);
});
```
