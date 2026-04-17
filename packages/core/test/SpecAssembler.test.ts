import { describe, it, expect } from 'vitest';
import { assembleSpec } from '../src/builder/SpecAssembler.js';
import { SchemaConverter } from '../src/builder/SchemaConverter.js';
import { OpenApiBuildError } from '../src/errors/OpenApiError.js';
import type { ISchemaAdapter, SchemaObject } from '../src/index.js';
import type { RouteDefinition } from '../src/builder/RouteRegistry.js';
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
    expect(() =>
      assembleSpec([], converter, { info: { title: '', version: '1.0.0' } }),
    ).toThrow(OpenApiBuildError);
  });

  it('throws when info.version is missing', () => {
    expect(() =>
      assembleSpec([], converter, { info: { title: 'API', version: '' } }),
    ).toThrow(OpenApiBuildError);
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
    expect(() => assembleSpec(routes, failConverter, { info: baseInfo })).toThrow(OpenApiBuildError);
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
});
