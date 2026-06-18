import { OpenApiAdapterError } from '@swagger-connect/core';
import type { ISchemaAdapter, AnySchema, SchemaObject } from '@swagger-connect/core';

interface YupDescription {
  type: string;
  label?: string;
  description?: string;
  meta?: Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tests?: { name: string; params?: Record<string, any> }[];
  fields?: Record<string, YupDescription>;
  oneOf?: unknown[];
   
  innerType?: YupDescription;
  nullable?: boolean;
}

export class YupSchemaAdapter implements ISchemaAdapter {
  readonly name = 'yup-adapter';

  canHandle(schema: AnySchema): boolean {
    if (typeof schema !== 'object' || schema === null) return false;
    const s = schema as Record<string, unknown>;
    if (typeof s.describe === 'function') {
      try {
        const desc = (s as { describe(): unknown }).describe();
        return typeof desc === 'object' && desc !== null && 'type' in (desc as Record<string, unknown>);
      } catch {
        return false;
      }
    }
    return false;
  }

  convert(schema: AnySchema): SchemaObject {
    if (!this.canHandle(schema)) {
      throw new OpenApiAdapterError(
        'YupSchemaAdapter received a non-Yup schema. Make sure you are passing a Yup schema instance.',
        this.name,
      );
    }

    try {
      const s = schema as { describe(): YupDescription };
      const description = s.describe();
      return this.convertDescription(description);
    } catch (err) {
      throw new OpenApiAdapterError(
        `YupSchemaAdapter failed to convert schema: ${(err as Error).message}`,
        this.name,
      );
    }
  }

  private convertDescription(desc: YupDescription): SchemaObject {
    const { type, label, description, tests, fields, oneOf, innerType } = desc;

    let result: SchemaObject = {};

    switch (type) {
      case 'string': {
        result.type = 'string';
        if (tests) {
          for (const test of tests) {
            switch (test.name) {
              case 'min': { const p = test.params; if (p) result.minLength = p.min ?? p.limit; break; }
              case 'max': { const p = test.params; if (p) result.maxLength = p.max ?? p.limit; break; }
              case 'length': { const p = test.params; if (p) { const v = p.length ?? p.limit; result.minLength = result.maxLength = v; } break; }
              case 'matches': { const p = test.params; if (p) result.pattern = p.regex ? String(p.regex) : p.pattern; break; }
              case 'email': result.format = 'email'; break;
              case 'url': result.format = 'uri'; break;
              case 'uuid': result.format = 'uuid'; break;
              case 'datetime': result.format = 'date-time'; break;
            }
          }
        }
        if (oneOf && oneOf.length > 0) {
          result.enum = oneOf;
        }
        break;
      }

      case 'number': {
        result.type = 'number';
        if (tests) {
          for (const test of tests) {
            switch (test.name) {
              case 'min': { const p = test.params; if (p) { result.minimum = p.min ?? p.limit ?? p.more; if (p.more != null) result.exclusiveMinimum = true; } break; }
              case 'max': { const p = test.params; if (p) { result.maximum = p.max ?? p.limit ?? p.less; if (p.less != null) result.exclusiveMaximum = true; } break; }
              case 'integer': result.type = 'integer'; break;
              case 'positive': result.minimum = 0; result.exclusiveMinimum = true; break;
              case 'negative': result.maximum = 0; result.exclusiveMaximum = true; break;
              case 'round': result.type = 'integer'; break;
            }
          }
        }
        if (oneOf && oneOf.length > 0) {
          result.enum = oneOf;
        }
        break;
      }

      case 'boolean': {
        result.type = 'boolean';
        break;
      }

      case 'date': {
        result.type = 'string';
        result.format = 'date-time';
        break;
      }

      case 'object': {
        result.type = 'object';
        if (fields && Object.keys(fields).length > 0) {
          result.properties = {};
          const required: string[] = [];
          for (const [key, fieldDesc] of Object.entries(fields)) {
            result.properties[key] = this.convertDescription(fieldDesc);
            if (fieldDesc.tests?.some((t) => t.name === 'required')) {
              required.push(key);
            }
          }
          if (required.length > 0) {
            result.required = required;
          }
        }
        break;
      }

      case 'array': {
        result.type = 'array';
        if (innerType) {
          result.items = this.convertDescription(innerType);
        }
        if (tests) {
          for (const test of tests) {
            switch (test.name) {
              case 'min': { const p = test.params; if (p) result.minItems = p.min ?? p.limit; break; }
              case 'max': { const p = test.params; if (p) result.maxItems = p.max ?? p.limit; break; }
              case 'length': { const p = test.params; if (p) { const v = p.length ?? p.limit; result.minItems = result.maxItems = v; } break; }
            }
          }
        }
        break;
      }

      case 'mixed': {
        break;
      }

      case 'lazy': {
        throw new OpenApiAdapterError(
          'YupSchemaAdapter does not support `lazy()` schemas because they require runtime evaluation.',
          this.name,
        );
      }

      default: {
        throw new OpenApiAdapterError(
          `Unsupported Yup type "${type}". Supported types: string, number, boolean, object, array, mixed, date.`,
          this.name,
        );
      }
    }

    if (desc.nullable === true) {
      result.nullable = true;
    }

    if (label) {
      result.title = label;
    }

    if (description) {
      result.description = description;
    }

    return result;
  }
}
