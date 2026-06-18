import { Kind } from '@sinclair/typebox';
import { OpenApiAdapterError } from '@swagger-connect/core';
import type { ISchemaAdapter, AnySchema, SchemaObject } from '@swagger-connect/core';

const ALLOWED_KEYS = new Set([
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
  'patternProperties',
  'minProperties',
  'maxProperties',
  'allOf',
  'anyOf',
  'oneOf',
  'not',
  '$ref',
]);

export class TypeBoxSchemaAdapter implements ISchemaAdapter {
  readonly name = 'typebox-adapter';

  canHandle(schema: AnySchema): boolean {
    if (typeof schema !== 'object' || schema === null) return false;
    const s = schema as Record<symbol, unknown>;
    // TypeBox schemas have a Kind symbol property (exported as Kind from TypeBox)
    return Kind in s;
  }

  convert(schema: AnySchema): SchemaObject {
    if (!this.canHandle(schema)) {
      throw new OpenApiAdapterError(
        'TypeBoxSchemaAdapter received a non-TypeBox schema. ' +
          'Make sure you are passing a TypeBox schema created with Type.Object(), Type.String(), etc.',
        this.name,
      );
    }

    try {
      const raw = this.extractRaw(schema);
      return this.normalize(raw);
    } catch (err) {
      throw new OpenApiAdapterError(
        `TypeBoxSchemaAdapter failed to convert schema: ${(err as Error).message}`,
        this.name,
      );
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractRaw(schema: any): Record<string, unknown> {
    const raw = schema.schema ?? schema;
    return { ...raw };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private normalize(raw: Record<string, any>): SchemaObject {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(raw)) {
      if (!ALLOWED_KEYS.has(key)) continue;

      if (key === 'properties' && typeof value === 'object' && value !== null) {
        result[key] = Object.fromEntries(
          Object.entries(value as Record<string, unknown>).map(([k, v]) => [
            k,
            this.normalize(v as Record<string, unknown>),
          ]),
        );
      } else if ((key === 'allOf' || key === 'anyOf' || key === 'oneOf') && Array.isArray(value)) {
        result[key] = value.map((v: Record<string, unknown>) => this.normalize(v));
      } else if (key === 'items' && typeof value === 'object' && value !== null) {
        result[key] = this.normalize(value as Record<string, unknown>);
      } else if (key === 'not' && typeof value === 'object' && value !== null) {
        result[key] = this.normalize(value as Record<string, unknown>);
      } else if (key === 'additionalProperties' && typeof value === 'object' && value !== null) {
        result[key] = this.normalize(value as Record<string, unknown>);
      } else if (key === 'patternProperties' && typeof value === 'object' && value !== null) {
        result[key] = Object.fromEntries(
          Object.entries(value as Record<string, unknown>).map(([k, v]) => [
            k,
            this.normalize(v as Record<string, unknown>),
          ]),
        );
      } else {
        result[key] = value;
      }
    }

    return result as SchemaObject;
  }
}
