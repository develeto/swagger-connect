import { describe, it, expect } from 'vitest';

import { SchemaConverter } from '../src/builder/SchemaConverter.js';
import { OpenApiAdapterError } from '../src/errors/OpenApiError.js';
import type { ISchemaAdapter, AnySchema, SchemaObject } from '../src/index.js';

const stringAdapter: ISchemaAdapter = {
  name: 'string-adapter',
  canHandle: (schema) => typeof schema === 'string',
  convert: (): SchemaObject => ({ type: 'string' }),
};

const numberAdapter: ISchemaAdapter = {
  name: 'number-adapter',
  canHandle: (schema) => typeof schema === 'number',
  convert: (): SchemaObject => ({ type: 'number' }),
};

describe('SchemaConverter', () => {
  it('delegates to the matching adapter', () => {
    const converter = new SchemaConverter([stringAdapter, numberAdapter]);
    expect(converter.convert('hello')).toEqual({ type: 'string' });
    expect(converter.convert(42)).toEqual({ type: 'number' });
  });

  it('uses the first adapter that canHandle (order matters)', () => {
    const alwaysTrue: ISchemaAdapter = {
      name: 'always-true',
      canHandle: () => true,
      convert: (): SchemaObject => ({ type: 'boolean' }),
    };
    const converter = new SchemaConverter([alwaysTrue, stringAdapter]);
    expect(converter.convert('anything')).toEqual({ type: 'boolean' });
  });

  it('throws OpenApiAdapterError when no adapter matches', () => {
    const converter = new SchemaConverter([stringAdapter]);
    expect(() => converter.convert({ unknown: true } as AnySchema)).toThrow(OpenApiAdapterError);
  });

  it('includes registered adapter names in the error message', () => {
    const converter = new SchemaConverter([stringAdapter, numberAdapter]);
    try {
      converter.convert(null);
    } catch (err) {
      expect((err as Error).message).toContain('string-adapter');
      expect((err as Error).message).toContain('number-adapter');
    }
  });

  it('throws with empty adapters list', () => {
    const converter = new SchemaConverter([]);
    expect(() => converter.convert('x')).toThrow(OpenApiAdapterError);
  });
});
