import { OpenApiAdapterError } from '@swagger-connect/core';
import { describe, it, expect } from 'vitest';
import * as yup from 'yup';

import { YupSchemaAdapter } from '../src/YupSchemaAdapter.js';

const adapter = new YupSchemaAdapter();

describe('YupSchemaAdapter', () => {
  it('canHandle returns true for Yup schemas', () => {
    expect(adapter.canHandle(yup.string())).toBe(true);
    expect(adapter.canHandle(yup.number())).toBe(true);
    expect(adapter.canHandle(yup.boolean())).toBe(true);
    expect(adapter.canHandle(yup.object({}))).toBe(true);
    expect(adapter.canHandle(yup.array())).toBe(true);
    expect(adapter.canHandle(yup.mixed())).toBe(true);
    expect(adapter.canHandle(yup.date())).toBe(true);
  });

  it('canHandle returns false for non-Yup schemas', () => {
    expect(adapter.canHandle({})).toBe(false);
    expect(adapter.canHandle('string')).toBe(false);
    expect(adapter.canHandle(null)).toBe(false);
    expect(adapter.canHandle(undefined)).toBe(false);
    expect(adapter.canHandle(42)).toBe(false);
  });

  it('converts yup.string()', () => {
    const result = adapter.convert(yup.string());
    expect(result).toEqual({ type: 'string' });
  });

  it('converts yup.string().min(2).max(100)', () => {
    const result = adapter.convert(yup.string().min(2).max(100));
    expect(result.type).toBe('string');
    expect(result.minLength).toBe(2);
    expect(result.maxLength).toBe(100);
  });

  it('converts yup.string().email()', () => {
    const result = adapter.convert(yup.string().email());
    expect(result.format).toBe('email');
  });

  it('converts yup.string().url()', () => {
    const result = adapter.convert(yup.string().url());
    expect(result.format).toBe('uri');
  });

  it('converts yup.number()', () => {
    const result = adapter.convert(yup.number());
    expect(result).toEqual({ type: 'number' });
  });

  it('converts yup.number().integer().min(1).max(100)', () => {
    const result = adapter.convert(yup.number().integer().min(1).max(100));
    expect(result.type).toBe('integer');
    expect(result.minimum).toBe(1);
    expect(result.maximum).toBe(100);
  });

  it('converts yup.boolean()', () => {
    const result = adapter.convert(yup.boolean());
    expect(result).toEqual({ type: 'boolean' });
  });

  it('converts yup.date()', () => {
    const result = adapter.convert(yup.date());
    expect(result.type).toBe('string');
    expect(result.format).toBe('date-time');
  });

  it('converts yup.object()', () => {
    const schema = yup.object({
      name: yup.string().required(),
      email: yup.string().email(),
    });
    const result = adapter.convert(schema);
    expect(result.type).toBe('object');
    expect(result.properties).toBeDefined();
    expect(result.properties?.name).toEqual({ type: 'string' });
    expect(result.properties?.email).toEqual({ type: 'string', format: 'email' });
    expect(result.required).toEqual(['name']);
  });

  it('converts yup.array()', () => {
    const result = adapter.convert(yup.array().of(yup.string()));
    expect(result.type).toBe('array');
    expect(result.items).toEqual({ type: 'string' });
  });

  it('converts yup.array().min(1).max(10)', () => {
    const result = adapter.convert(yup.array().of(yup.string()).min(1).max(10));
    expect(result.minItems).toBe(1);
    expect(result.maxItems).toBe(10);
  });

  it('converts yup.mixed()', () => {
    const result = adapter.convert(yup.mixed());
    expect(result).toEqual({});
  });

  it('handles nullable', () => {
    const result = adapter.convert(yup.string().nullable());
    expect(result.nullable).toBe(true);
  });

  it('throws OpenApiAdapterError on convert for non-Yup input', () => {
    expect(() => adapter.convert({})).toThrow(OpenApiAdapterError);
  });

  it('uses label as title', () => {
    const result = adapter.convert(yup.string().label('MyString'));
    expect(result.title).toBe('MyString');
  });

  it('converts yup.number().positive()', () => {
    const result = adapter.convert(yup.number().positive());
    expect(result.exclusiveMinimum).toBe(true);
    expect(result.minimum).toBe(0);
  });

  it('converts yup.string().uuid()', () => {
    const result = adapter.convert(yup.string().uuid());
    expect(result.format).toBe('uuid');
  });

  it('converts yup.string().length(10)', () => {
    const result = adapter.convert(yup.string().length(10));
    expect(result.minLength).toBe(10);
    expect(result.maxLength).toBe(10);
  });

  it('converts yup.string().matches(/[a-z]+/)', () => {
    const result = adapter.convert(yup.string().matches(/[a-z]+/));
    expect(result.pattern).toBeDefined();
  });

  it('converts yup.string().oneOf(["a","b"])', () => {
    const result = adapter.convert(yup.string().oneOf(['a', 'b']));
    expect(result.enum).toEqual(['a', 'b']);
  });

  it('converts yup.string().datetime()', () => {
    const result = adapter.convert(yup.string().datetime());
    expect(result.format).toBe('date-time');
  });

  it('converts yup.number().negative()', () => {
    const result = adapter.convert(yup.number().negative());
    expect(result.exclusiveMaximum).toBe(true);
    expect(result.maximum).toBe(0);
  });

  it('converts yup.number().round("floor") does not produce integer type', () => {
    const result = adapter.convert(yup.number().round('floor'));
    // round adds a transform, not a type override
    expect(result.type).toBe('number');
  });

  it('converts yup.number() with custom round test produces integer type', () => {
    const schema = yup.number().test('round', 'must be integer', () => true);
    const result = adapter.convert(schema);
    expect(result.type).toBe('integer');
  });

  it('converts schema with description', () => {
    const schema = {
      describe: () => ({ type: 'string', description: 'a field' }),
    };
    const result = adapter.convert(schema);
    expect(result.type).toBe('string');
    expect(result.description).toBe('a field');
  });

  it('converts yup.number().oneOf([1,2])', () => {
    const result = adapter.convert(yup.number().oneOf([1, 2]));
    expect(result.enum).toEqual([1, 2]);
  });

  it('converts yup.array().of(yup.string()).length(5)', () => {
    const result = adapter.convert(yup.array().of(yup.string()).length(5));
    expect(result.minItems).toBe(5);
    expect(result.maxItems).toBe(5);
  });

  it('converts yup.object() with no fields', () => {
    const result = adapter.convert(yup.object({}));
    expect(result.type).toBe('object');
    expect(result.properties).toBeUndefined();
  });

  it('throws OpenApiAdapterError for lazy() schemas', () => {
    const lazySchema = yup.lazy(() => yup.string());
    expect(() => adapter.convert(lazySchema)).toThrow(OpenApiAdapterError);
  });

  it('throws OpenApiAdapterError for unsupported Yup type', () => {
    const badSchema = {
      describe: () => ({ type: 'binary' }),
    };
    expect(() => adapter.convert(badSchema)).toThrow(OpenApiAdapterError);
  });

  it('canHandle returns false when describe throws', () => {
    const bad = {
      describe: () => {
        throw new Error('fail');
      },
    };
    expect(adapter.canHandle(bad)).toBe(false);
  });
});
