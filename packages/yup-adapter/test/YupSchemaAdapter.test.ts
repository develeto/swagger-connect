import { describe, it, expect } from 'vitest';
import * as yup from 'yup';
import { YupSchemaAdapter } from '../src/YupSchemaAdapter.js';
import { OpenApiAdapterError } from '@swagger-connect/core';

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
});
