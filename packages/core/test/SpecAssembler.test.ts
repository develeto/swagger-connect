import { describe, it, expect } from 'vitest';

import type { RouteDefinition } from '../src/builder/RouteRegistry.js';
import { SchemaConverter } from '../src/builder/SchemaConverter.js';
import { assembleSpec } from '../src/builder/SpecAssembler.js';
import { OpenApiBuildError } from '../src/errors/OpenApiError.js';
import type { ISchemaAdapter, SchemaObject } from '../src/index.js';
const passThrough: ISchemaAdapter = {
  name: 'pass-through',
  canHandle: () => true,
  convert: (s): SchemaObject => s as SchemaObject,
};

const converter = new SchemaConverter([passThrough]);

const baseInfo = { title: 'Test API', version: '1.0.0' };

describe('assembleSpec', () => {
  it('produces a valid OpenAPI 3.0.3 document structure', () => {
    const doc = assembleSpec([], converter, { info: baseInfo });
    expect(doc.openapi).toBe('3.0.3');
    expect(doc.info).toEqual(baseInfo);
    expect(doc.paths).toEqual({});
  });

  it('throws when info.title is missing', () => {
    expect(() => assembleSpec([], converter, { info: { title: '', version: '1.0.0' } })).toThrow(
      OpenApiBuildError,
    );
  });

  it('throws when info.version is missing', () => {
    expect(() => assembleSpec([], converter, { info: { title: 'API', version: '' } })).toThrow(
      OpenApiBuildError,
    );
  });

  it('maps a GET route into paths', () => {
    const routes: RouteDefinition[] = [
      {
        method: 'GET',
        path: '/users',
        summary: 'List users',
        responses: { 200: { type: 'array', items: { type: 'string' } } },
      },
    ];
    const doc = assembleSpec(routes, converter, { info: baseInfo });
    expect(doc.paths['/users']).toBeDefined();
    expect(doc.paths['/users']?.get?.summary).toBe('List users');
    expect(doc.paths['/users']?.get?.responses['200']).toBeDefined();
  });

  it('maps a POST route with requestBody', () => {
    const routes: RouteDefinition[] = [
      {
        method: 'POST',
        path: '/users',
        requestBody: { type: 'object', properties: { name: { type: 'string' } } },
        responses: { 201: { type: 'object' } },
      },
    ];
    const doc = assembleSpec(routes, converter, { info: baseInfo });
    expect(doc.paths['/users']?.post?.requestBody).toBeDefined();
    expect(doc.paths['/users']?.post?.requestBody?.content['application/json']).toBeDefined();
  });

  it('extracts path parameters from pathParams schema', () => {
    const routes: RouteDefinition[] = [
      {
        method: 'GET',
        path: '/users/{id}',
        pathParams: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
        responses: { 200: { type: 'object' } },
      },
    ];
    const doc = assembleSpec(routes, converter, { info: baseInfo });
    const params = doc.paths['/users/{id}']?.get?.parameters ?? [];
    expect(params).toHaveLength(1);
    expect(params[0]?.name).toBe('id');
    expect(params[0]?.in).toBe('path');
    expect(params[0]?.required).toBe(true);
  });

  it('extracts query parameters from queryParams schema', () => {
    const routes: RouteDefinition[] = [
      {
        method: 'GET',
        path: '/users',
        queryParams: {
          type: 'object',
          properties: { limit: { type: 'integer' } },
          required: ['limit'],
        },
        responses: { 200: { type: 'object' } },
      },
    ];
    const doc = assembleSpec(routes, converter, { info: baseInfo });
    const params = doc.paths['/users']?.get?.parameters ?? [];
    expect(params[0]?.in).toBe('query');
    expect(params[0]?.name).toBe('limit');
    expect(params[0]?.required).toBe(true);
  });

  it('passes through pre-built ResponseObject as-is', () => {
    const routes: RouteDefinition[] = [
      {
        method: 'GET',
        path: '/health',
        responses: {
          200: {
            description: 'Healthy',
            content: { 'application/json': { schema: { type: 'object' } } },
          },
        },
      },
    ];
    const doc = assembleSpec(routes, converter, { info: baseInfo });
    expect(doc.paths['/health']?.get?.responses['200']).toEqual({
      description: 'Healthy',
      content: { 'application/json': { schema: { type: 'object' } } },
    });
  });

  it('includes tags and servers when provided', () => {
    const doc = assembleSpec([], converter, {
      info: baseInfo,
      tags: [{ name: 'Users' }],
      servers: [{ url: 'https://api.example.com' }],
    });
    expect(doc.tags).toEqual([{ name: 'Users' }]);
    expect(doc.servers).toEqual([{ url: 'https://api.example.com' }]);
  });

  it('includes security schemes in components', () => {
    const doc = assembleSpec([], converter, {
      info: baseInfo,
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer' },
      },
    });
    expect(doc.components?.securitySchemes?.['bearerAuth']).toBeDefined();
  });

  it('groups multiple operations under the same path', () => {
    const routes: RouteDefinition[] = [
      { method: 'GET', path: '/items', responses: { 200: {} } },
      { method: 'POST', path: '/items', responses: { 201: {} } },
    ];
    const doc = assembleSpec(routes, converter, { info: baseInfo });
    expect(doc.paths['/items']?.get).toBeDefined();
    expect(doc.paths['/items']?.post).toBeDefined();
  });

  it('extracts header parameters from headers schema', () => {
    const routes: RouteDefinition[] = [
      {
        method: 'GET',
        path: '/protected',
        headers: {
          type: 'object',
          properties: { 'x-api-key': { type: 'string' } },
          required: ['x-api-key'],
        },
        responses: { 200: {} },
      },
    ];
    const doc = assembleSpec(routes, converter, { info: baseInfo });
    const params = doc.paths['/protected']?.get?.parameters ?? [];
    expect(params[0]?.in).toBe('header');
    expect(params[0]?.name).toBe('x-api-key');
  });

  it('wraps converter error in OpenApiBuildError', () => {
    const failingAdapter = {
      name: 'failing',
      canHandle: () => true,
      convert: (): never => {
        throw new Error('boom');
      },
    };
    const failConverter = new SchemaConverter([failingAdapter]);
    const routes: RouteDefinition[] = [
      { method: 'GET', path: '/fail', responses: { 200: { type: 'object' } } },
    ];
    expect(() => assembleSpec(routes, failConverter, { info: baseInfo })).toThrow(
      OpenApiBuildError,
    );
  });

  it('ignores pathParams when schema is not type object', () => {
    const routes: RouteDefinition[] = [
      {
        method: 'GET',
        path: '/items',
        pathParams: { type: 'string' },
        responses: { 200: {} },
      },
    ];
    const doc = assembleSpec(routes, converter, { info: baseInfo });
    expect(doc.paths['/items']?.get?.parameters ?? []).toHaveLength(0);
  });

  it('omits components when no securitySchemes are provided', () => {
    const doc = assembleSpec([], converter, { info: baseInfo });
    expect(doc.components).toBeUndefined();
  });

  it('omits tags and servers when empty', () => {
    const doc = assembleSpec([], converter, { info: baseInfo, tags: [], servers: [] });
    expect(doc.tags).toBeUndefined();
    expect(doc.servers).toBeUndefined();
  });

  describe('components.schemas extraction', () => {
    it('extracts a schema with title into components.schemas and uses $ref', () => {
      const routes: RouteDefinition[] = [
        {
          method: 'POST',
          path: '/users',
          requestBody: {
            type: 'object',
            title: 'CreateUser',
            properties: { name: { type: 'string' } },
          },
          responses: {
            201: { type: 'object', title: 'User', properties: { id: { type: 'string' } } },
          },
        },
      ];
      const doc = assembleSpec(routes, converter, { info: baseInfo });
      expect(doc.components?.schemas?.['User']).toEqual({
        type: 'object',
        properties: { id: { type: 'string' } },
      });
      expect(doc.components?.schemas?.['CreateUser']).toEqual({
        type: 'object',
        properties: { name: { type: 'string' } },
      });
      expect(
        doc.paths['/users']?.post?.requestBody?.content['application/json']?.schema?.$ref,
      ).toBe('#/components/schemas/CreateUser');
      expect(
        doc.paths['/users']?.post?.responses['201']?.content?.['application/json']?.schema?.$ref,
      ).toBe('#/components/schemas/User');
    });

    it('deduplicates schemas with the same title (first occurrence wins)', () => {
      const routes: RouteDefinition[] = [
        {
          method: 'POST',
          path: '/users',
          requestBody: { type: 'object', title: 'User', properties: { name: { type: 'string' } } },
          responses: {
            201: { type: 'object', title: 'User', properties: { id: { type: 'string' } } },
          },
        },
      ];
      const doc = assembleSpec(routes, converter, { info: baseInfo });
      expect(Object.keys(doc.components?.schemas ?? {})).toHaveLength(1);
      // First occurrence (requestBody) is kept
      expect(doc.components?.schemas?.['User']).toEqual({
        type: 'object',
        properties: { name: { type: 'string' } },
      });
      // Both occurrences are replaced by $ref
      expect(
        doc.paths['/users']?.post?.requestBody?.content['application/json']?.schema?.$ref,
      ).toBe('#/components/schemas/User');
      expect(
        doc.paths['/users']?.post?.responses['201']?.content?.['application/json']?.schema?.$ref,
      ).toBe('#/components/schemas/User');
    });

    it('extracts nested schemas from properties, items, allOf', () => {
      const routes: RouteDefinition[] = [
        {
          method: 'POST',
          path: '/items',
          requestBody: {
            type: 'object',
            properties: {
              nested: { type: 'object', title: 'Nested', properties: { val: { type: 'string' } } },
            },
          },
          responses: {
            200: {
              type: 'object',
              allOf: [{ type: 'object', title: 'Mixin', properties: { x: { type: 'number' } } }],
            },
          },
        },
      ];
      const doc = assembleSpec(routes, converter, { info: baseInfo });
      expect(doc.components?.schemas?.['Nested']).toBeDefined();
      expect(doc.components?.schemas?.['Mixin']).toBeDefined();
    });

    it('does not extract schemas without title', () => {
      const routes: RouteDefinition[] = [
        {
          method: 'GET',
          path: '/items',
          responses: { 200: { type: 'array', items: { type: 'string' } } },
        },
      ];
      const doc = assembleSpec(routes, converter, { info: baseInfo });
      expect(doc.components?.schemas).toBeUndefined();
    });

    it('preserves existing components when merging schemas', () => {
      const doc = assembleSpec(
        [
          {
            method: 'GET',
            path: '/items',
            responses: {
              200: { type: 'object', title: 'Item', properties: { id: { type: 'string' } } },
            },
          },
        ],
        converter,
        { info: baseInfo, securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer' } } },
      );
      expect(doc.components?.securitySchemes?.['bearerAuth']).toBeDefined();
      expect(doc.components?.schemas?.['Item']).toBeDefined();
    });

    it('extracts schema from path parameters', () => {
      const routes: RouteDefinition[] = [
        {
          method: 'GET',
          path: '/users/{id}',
          pathParams: {
            type: 'object',
            properties: { id: { type: 'string', title: 'UserId' } },
          },
          responses: { 200: {} },
        },
      ];
      const doc = assembleSpec(routes, converter, { info: baseInfo });
      expect(doc.components?.schemas?.['UserId']).toBeDefined();
    });

    it('extracts schema from query parameters', () => {
      const routes: RouteDefinition[] = [
        {
          method: 'GET',
          path: '/search',
          queryParams: {
            type: 'object',
            properties: { q: { type: 'string', title: 'SearchQuery' } },
          },
          responses: { 200: {} },
        },
      ];
      const doc = assembleSpec(routes, converter, { info: baseInfo });
      expect(doc.components?.schemas?.['SearchQuery']).toBeDefined();
    });

    it('skips schemas that already have a $ref', () => {
      const routes: RouteDefinition[] = [
        {
          method: 'GET',
          path: '/ref-test',
          responses: { 200: { $ref: '#/components/schemas/Existing' } },
        },
      ];
      const doc = assembleSpec(routes, converter, { info: baseInfo });
      expect(doc.components?.schemas).toBeUndefined();
      expect(
        doc.paths['/ref-test']?.get?.responses['200']?.content?.['application/json']?.schema?.$ref,
      ).toBe('#/components/schemas/Existing');
    });
  });
});
