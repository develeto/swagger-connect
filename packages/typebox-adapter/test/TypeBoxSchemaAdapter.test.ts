import { Kind, Type } from '@sinclair/typebox';
import { OpenApiAdapterError } from '@swagger-connect/core';
import { describe, it, expect } from 'vitest';

import { TypeBoxSchemaAdapter } from '../src/TypeBoxSchemaAdapter.js';

const adapter = new TypeBoxSchemaAdapter();

describe('TypeBoxSchemaAdapter', () => {
  it('canHandle returns true for TypeBox schemas', () => {
    expect(adapter.canHandle(Type.String())).toBe(true);
    expect(adapter.canHandle(Type.Number())).toBe(true);
    expect(adapter.canHandle(Type.Boolean())).toBe(true);
    expect(adapter.canHandle(Type.Object({}))).toBe(true);
    expect(adapter.canHandle(Type.Array(Type.String()))).toBe(true);
  });

  it('canHandle returns false for non-TypeBox schemas', () => {
    expect(adapter.canHandle({})).toBe(false);
    expect(adapter.canHandle('string')).toBe(false);
    expect(adapter.canHandle(null)).toBe(false);
    expect(adapter.canHandle(undefined)).toBe(false);
    expect(adapter.canHandle(42)).toBe(false);
  });

  it('converts Type.String()', () => {
    const result = adapter.convert(Type.String());
    expect(result).toEqual({ type: 'string' });
  });

  it('converts Type.String({ minLength: 2, maxLength: 100 })', () => {
    const result = adapter.convert(Type.String({ minLength: 2, maxLength: 100 }));
    expect(result.type).toBe('string');
    expect(result.minLength).toBe(2);
    expect(result.maxLength).toBe(100);
  });

  it('converts Type.String({ format: "email" })', () => {
    const result = adapter.convert(Type.String({ format: 'email' }));
    expect(result.format).toBe('email');
  });

  it('converts Type.Number()', () => {
    const result = adapter.convert(Type.Number());
    expect(result).toEqual({ type: 'number' });
  });

  it('converts Type.Number({ minimum: 1, maximum: 100 })', () => {
    const result = adapter.convert(Type.Number({ minimum: 1, maximum: 100 }));
    expect(result.minimum).toBe(1);
    expect(result.maximum).toBe(100);
  });

  it('converts Type.Integer()', () => {
    const result = adapter.convert(Type.Integer());
    expect(result.type).toBe('integer');
  });

  it('converts Type.Boolean()', () => {
    const result = adapter.convert(Type.Boolean());
    expect(result).toEqual({ type: 'boolean' });
  });

  it('converts Type.Object()', () => {
    const schema = Type.Object({
      name: Type.String(),
      email: Type.String({ format: 'email' }),
    });
    const result = adapter.convert(schema);
    expect(result.type).toBe('object');
    expect(result.properties).toBeDefined();
    expect(result.properties?.name).toEqual({ type: 'string' });
    expect(result.properties?.email).toEqual({ type: 'string', format: 'email' });
  });

  it('converts Type.Object() with required fields', () => {
    const schema = Type.Object({
      name: Type.String(),
      age: Type.Optional(Type.Number()),
    });
    const result = adapter.convert(schema);
    expect(result.required).toEqual(['name']);
  });

  it('converts Type.Array()', () => {
    const result = adapter.convert(Type.Array(Type.String()));
    expect(result.type).toBe('array');
    expect(result.items).toEqual({ type: 'string' });
  });

  it('converts Type.Union()', () => {
    const schema = Type.Union([Type.String(), Type.Number()]);
    const result = adapter.convert(schema);
    expect(result.anyOf).toBeDefined();
    expect(result.anyOf).toHaveLength(2);
  });

  it('converts Type.Intersect()', () => {
    const schema = Type.Intersect([
      Type.Object({ a: Type.String() }),
      Type.Object({ b: Type.Number() }),
    ]);
    const result = adapter.convert(schema);
    expect(result.allOf).toBeDefined();
    expect(result.allOf).toHaveLength(2);
  });

  it('converts Type.Partial()', () => {
    const schema = Type.Partial(Type.Object({ name: Type.String() }));
    const result = adapter.convert(schema);
    expect(result.type).toBe('object');
    expect(result.properties?.name).toBeDefined();
  });

  it('uses title and description from TypeBox options', () => {
    const result = adapter.convert(
      Type.String({ title: 'MyString', description: 'A string field' }),
    );
    expect(result.title).toBe('MyString');
    expect(result.description).toBe('A string field');
  });

  it('strips TypeBox internal properties (Kind symbol)', () => {
    const schema = Type.String();
    const symbols = Object.getOwnPropertySymbols(schema);
    expect(symbols.length).toBeGreaterThan(0);
    const result = adapter.convert(schema);
    expect(Object.getOwnPropertySymbols(result).length).toBe(0);
  });

  it('strips non-OpenAPI keys from schema', () => {
    const schema = Type.Unsafe({ type: 'string', 'x-internal': true });
    const result = adapter.convert(schema);
    expect(result).toEqual({ type: 'string' });
    expect((result as Record<string, unknown>)['x-internal']).toBeUndefined();
  });

  it('converts Type.Null()', () => {
    const result = adapter.convert(Type.Null());
    expect(result).toEqual({ type: 'null' });
  });

  it('converts Type.Literal()', () => {
    const result = adapter.convert(Type.Literal('hello'));
    expect(result.const).toBe('hello');
  });

  it('converts Type.Enum()', () => {
    const result = adapter.convert(Type.Enum({ A: 'a', B: 'b' }));
    expect(result.anyOf).toBeDefined();
    expect(result.anyOf).toHaveLength(2);
  });

  it('converts schema with additionalProperties', () => {
    const schema = Type.Unsafe({
      type: 'object',
      additionalProperties: { type: 'number' },
    });
    const result = adapter.convert(schema);
    expect(result.type).toBe('object');
    expect(result.additionalProperties).toEqual({ type: 'number' });
  });

  it('handles TypeBox Not schema', () => {
    const schema = Type.Unsafe({ not: { type: 'string' } });
    const result = adapter.convert(schema);
    expect(result.not).toEqual({ type: 'string' });
  });

  it('throws OpenApiAdapterError when convert fails', () => {
    const badSchema = {
      [Kind]: 'Object',
      get schema() {
        throw new Error('corrupt');
      },
    };
    expect(() => adapter.convert(badSchema)).toThrow(OpenApiAdapterError);
  });

  it('converts Type.Record()', () => {
    const result = adapter.convert(Type.Record(Type.String(), Type.Number()));
    expect(result.type).toBe('object');
    expect(result.patternProperties).toBeDefined();
    expect(result.patternProperties?.['^(.*)$']).toEqual({ type: 'number' });
  });

  it('throws OpenApiAdapterError on convert for non-TypeBox input', () => {
    expect(() => adapter.convert({})).toThrow(OpenApiAdapterError);
  });

  it('converts nullable schema (Type.Union with Type.Null)', () => {
    const result = adapter.convert(Type.Optional(Type.Union([Type.String(), Type.Null()])));
    expect(result.anyOf).toBeDefined();
    expect(result.anyOf).toHaveLength(2);
  });
});
