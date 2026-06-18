import { OpenApiAdapterError } from '@swagger-connect/core';
import Joi from 'joi';
import { describe, it, expect } from 'vitest';

import { JoiSchemaAdapter } from '../src/JoiSchemaAdapter.js';

const adapter = new JoiSchemaAdapter();

describe('JoiSchemaAdapter', () => {
  it('canHandle returns true for Joi schemas', () => {
    expect(adapter.canHandle(Joi.string())).toBe(true);
    expect(adapter.canHandle(Joi.number())).toBe(true);
    expect(adapter.canHandle(Joi.object({}))).toBe(true);
    expect(adapter.canHandle(Joi.array())).toBe(true);
    expect(adapter.canHandle(Joi.boolean())).toBe(true);
    expect(adapter.canHandle(Joi.date())).toBe(true);
    expect(adapter.canHandle(Joi.any())).toBe(true);
  });

  it('canHandle returns false for non-Joi schemas', () => {
    expect(adapter.canHandle({})).toBe(false);
    expect(adapter.canHandle('string')).toBe(false);
    expect(adapter.canHandle(null)).toBe(false);
    expect(adapter.canHandle(undefined)).toBe(false);
    expect(adapter.canHandle(42)).toBe(false);
  });

  it('converts Joi.string()', () => {
    const result = adapter.convert(Joi.string());
    expect(result).toEqual({ type: 'string' });
  });

  it('converts Joi.string().min(2).max(100)', () => {
    const result = adapter.convert(Joi.string().min(2).max(100));
    expect(result.type).toBe('string');
    expect(result.minLength).toBe(2);
    expect(result.maxLength).toBe(100);
  });

  it('converts Joi.string().email()', () => {
    const result = adapter.convert(Joi.string().email());
    expect(result.format).toBe('email');
  });

  it('converts Joi.string().uri()', () => {
    const result = adapter.convert(Joi.string().uri());
    expect(result.format).toBe('uri');
  });

  it('converts Joi.string().uuid()', () => {
    const result = adapter.convert(Joi.string().uuid());
    expect(result.format).toBe('uuid');
  });

  it('converts Joi.number()', () => {
    const result = adapter.convert(Joi.number());
    expect(result).toEqual({ type: 'number' });
  });

  it('converts Joi.number().integer().min(1).max(100)', () => {
    const result = adapter.convert(Joi.number().integer().min(1).max(100));
    expect(result.type).toBe('integer');
    expect(result.minimum).toBe(1);
    expect(result.maximum).toBe(100);
  });

  it('converts Joi.boolean()', () => {
    const result = adapter.convert(Joi.boolean());
    expect(result).toEqual({ type: 'boolean' });
  });

  it('converts Joi.date()', () => {
    const result = adapter.convert(Joi.date());
    expect(result.type).toBe('string');
    expect(result.format).toBe('date-time');
  });

  it('converts Joi.object()', () => {
    const schema = Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email(),
    });
    const result = adapter.convert(schema);
    expect(result.type).toBe('object');
    expect(result.properties).toBeDefined();
    expect(result.properties?.name).toEqual({ type: 'string' });
    expect(result.properties?.email).toEqual({ type: 'string', format: 'email' });
    expect(result.required).toEqual(['name']);
  });

  it('converts Joi.array()', () => {
    const result = adapter.convert(Joi.array().items(Joi.string()));
    expect(result.type).toBe('array');
    expect(result.items).toEqual({ type: 'string' });
  });

  it('converts Joi.array().min(1).max(10)', () => {
    const result = adapter.convert(Joi.array().items(Joi.string()).min(1).max(10));
    expect(result.minItems).toBe(1);
    expect(result.maxItems).toBe(10);
  });

  it('converts Joi.alternatives() (union)', () => {
    const result = adapter.convert(Joi.alternatives().try(Joi.string(), Joi.number()));
    expect(result.anyOf).toBeDefined();
    expect(result.anyOf).toHaveLength(2);
  });

  it('converts Joi.any()', () => {
    const result = adapter.convert(Joi.any());
    expect(result).toEqual({});
  });

  it('handles nullable with allow(null)', () => {
    const result = adapter.convert(Joi.string().allow(null));
    expect(result.nullable).toBe(true);
  });

  it('uses label as title', () => {
    const result = adapter.convert(Joi.string().label('MyString'));
    expect(result.title).toBe('MyString');
  });

  it('uses description from Joi description', () => {
    const result = adapter.convert(Joi.string().description('A string field'));
    expect(result.description).toBe('A string field');
  });

  it('throws OpenApiAdapterError on convert for non-Joi input', () => {
    expect(() => adapter.convert({})).toThrow(OpenApiAdapterError);
  });

  it('converts Joi.array().unique()', () => {
    const result = adapter.convert(Joi.array().items(Joi.string()).unique());
    expect(result.uniqueItems).toBe(true);
  });

  it('converts Joi.number().positive()', () => {
    const result = adapter.convert(Joi.number().positive());
    expect(result.exclusiveMinimum).toBe(true);
    expect(result.minimum).toBe(0);
  });
});
