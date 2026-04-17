import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { ZodSchemaAdapter } from '../src/ZodSchemaAdapter.js';
import { OpenApiAdapterError } from '@swagger-connect/core';

const adapter = new ZodSchemaAdapter();

describe('ZodSchemaAdapter', () => {
  describe('canHandle', () => {
    it('returns true for Zod schemas', () => {
      expect(adapter.canHandle(z.string())).toBe(true);
      expect(adapter.canHandle(z.object({}))).toBe(true);
      expect(adapter.canHandle(z.array(z.string()))).toBe(true);
    });

    it('returns false for non-Zod values', () => {
      expect(adapter.canHandle('a string')).toBe(false);
      expect(adapter.canHandle({ type: 'string' })).toBe(false);
      expect(adapter.canHandle(null)).toBe(false);
      expect(adapter.canHandle(undefined)).toBe(false);
    });
  });

  describe('convert — primitive types', () => {
    it('converts z.string()', () => {
      const result = adapter.convert(z.string());
      expect(result.type).toBe('string');
    });

    it('converts z.string().min().max()', () => {
      const result = adapter.convert(z.string().min(2).max(50));
      expect(result.minLength).toBe(2);
      expect(result.maxLength).toBe(50);
    });

    it('converts z.string().email()', () => {
      const result = adapter.convert(z.string().email());
      expect(result.type).toBe('string');
      expect(result.format).toBe('email');
    });

    it('converts z.string().uuid()', () => {
      const result = adapter.convert(z.string().uuid());
      expect(result.format).toBe('uuid');
    });

    it('converts z.number()', () => {
      const result = adapter.convert(z.number());
      expect(result.type).toBe('number');
    });

    it('converts z.number().min().max()', () => {
      const result = adapter.convert(z.number().min(0).max(100));
      expect(result.minimum).toBe(0);
      expect(result.maximum).toBe(100);
    });

    it('converts z.boolean()', () => {
      const result = adapter.convert(z.boolean());
      expect(result.type).toBe('boolean');
    });

    it('converts z.literal()', () => {
      const result = adapter.convert(z.literal('admin'));
      // zod-to-json-schema represents literals as single-value enum or const
      expect(result.const === 'admin' || (result.enum && result.enum[0] === 'admin')).toBe(true);
    });
  });

  describe('convert — complex types', () => {
    it('converts z.object()', () => {
      const result = adapter.convert(
        z.object({ name: z.string(), age: z.number() }),
      );
      expect(result.type).toBe('object');
      expect(result.properties?.['name']).toEqual({ type: 'string' });
      expect(result.properties?.['age']).toEqual({ type: 'number' });
      expect(result.required).toContain('name');
      expect(result.required).toContain('age');
    });

    it('converts z.array()', () => {
      const result = adapter.convert(z.array(z.string()));
      expect(result.type).toBe('array');
      expect(result.items?.type).toBe('string');
    });

    it('converts z.enum()', () => {
      const result = adapter.convert(z.enum(['a', 'b', 'c']));
      expect(result.type).toBe('string');
      expect(result.enum).toEqual(['a', 'b', 'c']);
    });

    it('converts z.union() to anyOf', () => {
      const result = adapter.convert(z.union([z.string(), z.number()]));
      expect(result.anyOf ?? result.oneOf).toBeDefined();
    });

    it('converts z.optional() field inside object', () => {
      const result = adapter.convert(
        z.object({ name: z.string(), bio: z.string().optional() }),
      );
      expect(result.required).toContain('name');
      expect(result.required).not.toContain('bio');
    });

    it('converts z.nullable()', () => {
      const result = adapter.convert(z.string().nullable());
      expect(result.nullable).toBe(true);
    });

    it('converts z.record()', () => {
      const result = adapter.convert(z.record(z.string()));
      expect(result.type).toBe('object');
    });

    it('converts z.tuple()', () => {
      const result = adapter.convert(z.tuple([z.string(), z.number()]));
      expect(result.type).toBe('array');
    });

    it('converts z.any()', () => {
      const result = adapter.convert(z.any());
      expect(result).toBeDefined();
    });

    it('converts z.unknown()', () => {
      const result = adapter.convert(z.unknown());
      expect(result).toBeDefined();
    });
  });

  describe('errors', () => {
    it('throws OpenApiAdapterError for non-Zod input', () => {
      expect(() => adapter.convert({ type: 'string' })).toThrow(OpenApiAdapterError);
    });

    it('includes adapter name in error', () => {
      try {
        adapter.convert('not-a-zod-schema');
      } catch (err) {
        expect(err).toBeInstanceOf(OpenApiAdapterError);
        expect((err as OpenApiAdapterError).adapterName).toBe('zod-adapter');
      }
    });
  });
});
