import { OpenApiAdapterError } from '@swagger-connect/core';
import type { ISchemaAdapter, AnySchema, SchemaObject } from '@swagger-connect/core';
import { ZodType } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

/**
 * Schema adapter for Zod v3.
 * Uses `zod-to-json-schema` to convert Zod schemas to OpenAPI Schema Objects.
 */
export class ZodSchemaAdapter implements ISchemaAdapter {
  readonly name = 'zod-adapter';

  canHandle(schema: AnySchema): boolean {
    return schema instanceof ZodType;
  }

  convert(schema: AnySchema): SchemaObject {
    if (!(schema instanceof ZodType)) {
      throw new OpenApiAdapterError(
        `ZodSchemaAdapter received a non-Zod schema. ` +
          `Make sure you are passing a Zod schema instance (e.g., z.object({...})).`,
        this.name,
      );
    }

    try {
      const jsonSchema = zodToJsonSchema(schema, {
        target: 'openApi3',
        $refStrategy: 'none',
      });

      return this.normalize(jsonSchema);
    } catch (err) {
      throw new OpenApiAdapterError(
        `ZodSchemaAdapter failed to convert schema: ${(err as Error).message}`,
        this.name,
      );
    }
  }

  /**
   * Strips JSON Schema properties not valid in OpenAPI 3.0 Schema Objects
   * and normalizes the output.
   */
  private normalize(raw: Record<string, unknown>): SchemaObject {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: Record<string, any> = {};

    const allowed = new Set([
      'type',
      'title',
      'description',
      'format',
      'default',
      'example',
      'enum',
      'const',
      'nullable',
      'minLength',
      'maxLength',
      'pattern',
      'minimum',
      'maximum',
      'exclusiveMinimum',
      'exclusiveMaximum',
      'multipleOf',
      'items',
      'minItems',
      'maxItems',
      'uniqueItems',
      'properties',
      'required',
      'additionalProperties',
      'minProperties',
      'maxProperties',
      'allOf',
      'anyOf',
      'oneOf',
      'not',
      '$ref',
    ]);

    for (const [key, value] of Object.entries(raw)) {
      if (!allowed.has(key)) continue;

      if (key === 'properties' && typeof value === 'object' && value !== null) {
        result[key] = Object.fromEntries(
          Object.entries(value as Record<string, unknown>).map(([k, v]) => [
            k,
            this.normalize(v as Record<string, unknown>),
          ]),
        );
      } else if (
        (key === 'allOf' || key === 'anyOf' || key === 'oneOf') &&
        Array.isArray(value)
      ) {
        result[key] = value.map((v) => this.normalize(v as Record<string, unknown>));
      } else if (key === 'items' && typeof value === 'object' && value !== null) {
        result[key] = this.normalize(value as Record<string, unknown>);
      } else if (key === 'not' && typeof value === 'object' && value !== null) {
        result[key] = this.normalize(value as Record<string, unknown>);
      } else if (
        key === 'additionalProperties' &&
        typeof value === 'object' &&
        value !== null
      ) {
        result[key] = this.normalize(value as Record<string, unknown>);
      } else {
        result[key] = value;
      }
    }

    return result as SchemaObject;
  }
}
