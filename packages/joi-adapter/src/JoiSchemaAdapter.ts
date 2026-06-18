import { OpenApiAdapterError } from '@swagger-connect/core';
import type { ISchemaAdapter, AnySchema, SchemaObject } from '@swagger-connect/core';

interface JoiFlags {
  label?: string;
  description?: string;
  presence?: string;
  [key: string]: unknown;
}

interface JoiDescription {
  type: string;
  flags?: JoiFlags;
  allow?: unknown[];
  keys?: Record<string, JoiDescription>;
  items?: JoiDescription[];
  alternatives?: JoiDescription[];
  matches?: { schema: JoiDescription }[];
  rules?: { name: string; args?: Record<string, unknown> }[];
}

export class JoiSchemaAdapter implements ISchemaAdapter {
  readonly name = 'joi-adapter';

  canHandle(schema: AnySchema): boolean {
    if (typeof schema !== 'object' || schema === null) return false;
    const s = schema as Record<string, unknown>;
    if (typeof s.type === 'string' && typeof s.describe === 'function') {
      return true;
    }
    return false;
  }

  convert(schema: AnySchema): SchemaObject {
    if (!this.canHandle(schema)) {
      throw new OpenApiAdapterError(
        'JoiSchemaAdapter received a non-Joi schema.',
        this.name,
      );
    }

    try {
      const j = schema as { describe(): JoiDescription };
      const description = j.describe();
      return this.convertDescription(description);
    } catch (err) {
      throw new OpenApiAdapterError(
        `JoiSchemaAdapter failed to convert schema: ${(err as Error).message}`,
        this.name,
      );
    }
  }

  private convertDescription(desc: JoiDescription): SchemaObject {
    const { type, flags, rules, keys, items, matches } = desc;

    let result: SchemaObject = {};

    switch (type) {
      case 'string': {
        result.type = 'string';
        if (rules) {
          for (const rule of rules) {
            switch (rule.name) {
              case 'min': result.minLength = rule.args?.limit as number; break;
              case 'max': result.maxLength = rule.args?.limit as number; break;
              case 'pattern': result.pattern = rule.args?.regex?.toString() ?? rule.args?.pattern as string; break;
              case 'email': result.format = 'email'; break;
              case 'uri': result.format = 'uri'; break;
              case 'uuid': result.format = 'uuid'; break;
              case 'guid': result.format = 'uuid'; break;
              case 'isoDate': result.format = 'date-time'; break;
              case 'length': result.minLength = result.maxLength = rule.args?.limit as number; break;
            }
          }
        }
        break;
      }

      case 'number': {
        result.type = 'number';
        if (rules) {
          for (const rule of rules) {
            switch (rule.name) {
              case 'min': result.minimum = rule.args?.limit as number; break;
              case 'max': result.maximum = rule.args?.limit as number; break;
              case 'integer': result.type = 'integer'; break;
              case 'multiple': result.multipleOf = rule.args?.base as number; break;
              case 'positive': result.minimum = 0; result.exclusiveMinimum = true; break;
              case 'negative': result.maximum = 0; result.exclusiveMaximum = true; break;
              case 'sign': {
                const sign = rule.args?.sign as string;
                if (sign === 'positive') {
                  result.minimum = 0;
                  result.exclusiveMinimum = true;
                } else if (sign === 'negative') {
                  result.maximum = 0;
                  result.exclusiveMaximum = true;
                }
                break;
              }
            }
          }
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
        if (keys && Object.keys(keys).length > 0) {
          result.properties = {};
          const required: string[] = [];
          for (const [key, keyDesc] of Object.entries(keys)) {
            if (keyDesc.flags?.presence === 'required') {
              required.push(key);
            }
            result.properties[key] = this.convertDescription(keyDesc);
          }
          if (required.length > 0) {
            result.required = required;
          }
        }
        break;
      }

      case 'array': {
        result.type = 'array';
        if (items && items.length > 0) {
          if (items.length === 1 && items[0] !== undefined) {
            result.items = this.convertDescription(items[0]);
          } else {
            result.items = { anyOf: items.filter((i): i is JoiDescription => i !== undefined).map((i) => this.convertDescription(i)) };
          }
        }
        if (rules) {
          for (const rule of rules) {
            switch (rule.name) {
              case 'min': result.minItems = rule.args?.limit as number; break;
              case 'max': result.maxItems = rule.args?.limit as number; break;
              case 'unique': result.uniqueItems = true; break;
              case 'length': result.minItems = result.maxItems = rule.args?.limit as number; break;
            }
          }
        }
        break;
      }

      case 'alternatives': {
        if (matches && matches.length > 0) {
          result.anyOf = matches.map((m) => this.convertDescription(m.schema));
        }
        break;
      }

      case 'any': {
        break;
      }

      default: {
        throw new OpenApiAdapterError(
          `Unsupported Joi type "${type}". Supported types: string, number, boolean, object, array, alternatives, date, any.`,
          this.name,
        );
      }
    }

    if (desc.allow?.includes(null)) {
      result.nullable = true;
    }

    if (flags?.description) {
      result.description = flags.description as string;
    }

    if (flags?.label) {
      result.title = flags.label as string;
    }

    return result;
  }
}
