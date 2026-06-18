import { describe, it, expect } from 'vitest';

import { DocBuilder } from '../src/builder/DocBuilder.js';
import { OpenApiValidationError } from '../src/errors/OpenApiError.js';
import type { ISchemaAdapter, SchemaObject } from '../src/index.js';

const mockAdapter: ISchemaAdapter = {
  name: 'mock',
  canHandle: () => true,
  convert: (s): SchemaObject => s as SchemaObject,
};

describe('DocBuilder', () => {
  it('throws when adapter is not provided', () => {
    expect(
      () =>
        new DocBuilder({
          info: { title: 'API', version: '1.0.0' },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          adapter: undefined as any,
        }),
    ).toThrow(OpenApiValidationError);
  });

  it('builds a minimal valid document', () => {
    const doc = new DocBuilder({
      info: { title: 'My API', version: '1.0.0' },
      adapter: mockAdapter,
    }).build();

    expect(doc.openapi).toBe('3.0.3');
    expect(doc.info.title).toBe('My API');
    expect(doc.paths).toEqual({});
  });

  it('addRoute is fluent and registers the route', () => {
    const doc = new DocBuilder({ info: { title: 'API', version: '1' }, adapter: mockAdapter })
      .addRoute({ method: 'GET', path: '/health', responses: { 200: { type: 'object' } } })
      .build();

    expect(doc.paths['/health']).toBeDefined();
    expect(doc.paths['/health']?.get).toBeDefined();
  });

  it('addRoutes registers multiple routes', () => {
    const doc = new DocBuilder({ info: { title: 'API', version: '1' }, adapter: mockAdapter })
      .addRoutes([
        { method: 'GET', path: '/a', responses: { 200: {} } },
        { method: 'GET', path: '/b', responses: { 200: {} } },
      ])
      .build();

    expect(Object.keys(doc.paths)).toHaveLength(2);
  });

  it('addTag appends tag to document', () => {
    const doc = new DocBuilder({ info: { title: 'API', version: '1' }, adapter: mockAdapter })
      .addTag({ name: 'Users', description: 'User operations' })
      .build();

    expect(doc.tags).toEqual([{ name: 'Users', description: 'User operations' }]);
  });

  it('addServer appends server to document', () => {
    const doc = new DocBuilder({ info: { title: 'API', version: '1' }, adapter: mockAdapter })
      .addServer({ url: 'https://api.example.com' })
      .build();

    expect(doc.servers).toEqual([{ url: 'https://api.example.com' }]);
  });

  it('addSecurityScheme adds to components', () => {
    const doc = new DocBuilder({ info: { title: 'API', version: '1' }, adapter: mockAdapter })
      .addSecurityScheme('bearerAuth', { type: 'http', scheme: 'bearer' })
      .build();

    expect(doc.components?.securitySchemes?.['bearerAuth']).toBeDefined();
  });

  it('toJSON returns a valid JSON string', () => {
    const json = new DocBuilder({
      info: { title: 'API', version: '1.0.0' },
      adapter: mockAdapter,
    }).toJSON();

    expect(() => JSON.parse(json)).not.toThrow();
    expect(JSON.parse(json).openapi).toBe('3.0.3');
  });

  it('addAdapter adds a second adapter', () => {
    const secondAdapter: ISchemaAdapter = {
      name: 'second',
      canHandle: (s) => s === 'special',
      convert: (): SchemaObject => ({ type: 'boolean' }),
    };

    const doc = new DocBuilder({ info: { title: 'API', version: '1' }, adapter: mockAdapter })
      .addAdapter(secondAdapter)
      .addRoute({
        method: 'GET',
        path: '/test',
        responses: { 200: 'special' },
      })
      .build();

    expect(doc.paths['/test']?.get?.responses['200']).toBeDefined();
  });

  it('withSecurity sets global security', () => {
    const doc = new DocBuilder({ info: { title: 'API', version: '1' }, adapter: mockAdapter })
      .withSecurity([{ bearerAuth: [] }])
      .build();

    expect(doc.security).toEqual([{ bearerAuth: [] }]);
  });

  it('options.security is used when withSecurity not called', () => {
    const doc = new DocBuilder({
      info: { title: 'API', version: '1' },
      adapter: mockAdapter,
      security: [{ apiKey: [] }],
    }).build();

    expect(doc.security).toEqual([{ apiKey: [] }]);
  });

  it('options.servers and tags are merged with addServer/addTag', () => {
    const doc = new DocBuilder({
      info: { title: 'API', version: '1' },
      adapter: mockAdapter,
      servers: [{ url: 'https://a.com' }],
      tags: [{ name: 'A' }],
    })
      .addServer({ url: 'https://b.com' })
      .addTag({ name: 'B' })
      .build();

    expect(doc.servers).toHaveLength(2);
    expect(doc.tags).toHaveLength(2);
  });
});
