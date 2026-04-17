import { OpenApiAdapterError } from '../errors/OpenApiError.js';
import type { ISchemaAdapter, AnySchema } from '../adapters/ISchemaAdapter.js';
import type { SchemaObject } from '../types/openapi.types.js';

export class SchemaConverter {
  constructor(private readonly adapters: ISchemaAdapter[]) {}

  convert(schema: AnySchema): SchemaObject {
    const adapter = this.adapters.find((a) => a.canHandle(schema));

    if (!adapter) {
      const names = this.adapters.map((a) => a.name).join(', ');
      throw new OpenApiAdapterError(
        `No adapter could handle the provided schema. ` +
          `Registered adapters: [${names}]. ` +
          `Make sure you are passing a schema instance from a supported library.`,
        'none',
      );
    }

    return adapter.convert(schema);
  }
}
