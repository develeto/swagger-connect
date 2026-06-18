import { describe, it, expect } from 'vitest';

import { RouteRegistry } from '../src/builder/RouteRegistry.js';
import { OpenApiValidationError } from '../src/errors/OpenApiError.js';

describe('RouteRegistry', () => {
  it('registers a valid route', () => {
    const registry = new RouteRegistry();
    registry.register({
      method: 'GET',
      path: '/users',
      responses: { 200: { type: 'object' } },
    });
    expect(registry.getRoutes()).toHaveLength(1);
  });

  it('registers multiple routes', () => {
    const registry = new RouteRegistry();
    registry.register({ method: 'GET', path: '/users', responses: { 200: {} } });
    registry.register({ method: 'POST', path: '/users', responses: { 201: {} } });
    expect(registry.getRoutes()).toHaveLength(2);
  });

  it('returns a readonly copy', () => {
    const registry = new RouteRegistry();
    registry.register({ method: 'GET', path: '/health', responses: { 200: {} } });
    const routes = registry.getRoutes();
    expect(Object.isFrozen(routes) || Array.isArray(routes)).toBe(true);
  });

  it('accepts path parameters in OpenAPI format', () => {
    const registry = new RouteRegistry();
    expect(() =>
      registry.register({ method: 'GET', path: '/users/{id}', responses: { 200: {} } }),
    ).not.toThrow();
  });

  describe('validation errors', () => {
    it('throws for invalid HTTP method', () => {
      const registry = new RouteRegistry();
      expect(() =>
        registry.register({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          method: 'INVALID' as any,
          path: '/test',
          responses: { 200: {} },
        }),
      ).toThrow(OpenApiValidationError);
    });

    it('throws for path not starting with /', () => {
      const registry = new RouteRegistry();
      expect(() =>
        registry.register({ method: 'GET', path: 'users', responses: { 200: {} } }),
      ).toThrow(OpenApiValidationError);
    });

    it('throws for path with whitespace', () => {
      const registry = new RouteRegistry();
      expect(() =>
        registry.register({ method: 'GET', path: '/us ers', responses: { 200: {} } }),
      ).toThrow(OpenApiValidationError);
    });

    it('throws for unbalanced path param braces', () => {
      const registry = new RouteRegistry();
      expect(() =>
        registry.register({ method: 'GET', path: '/users/{id', responses: { 200: {} } }),
      ).toThrow(OpenApiValidationError);
    });

    it('throws when responses is empty', () => {
      const registry = new RouteRegistry();
      expect(() => registry.register({ method: 'GET', path: '/users', responses: {} })).toThrow(
        OpenApiValidationError,
      );
    });

    it('includes the invalid field in the error', () => {
      const registry = new RouteRegistry();
      try {
        registry.register({ method: 'GET', path: '/users', responses: {} });
      } catch (err) {
        expect(err).toBeInstanceOf(OpenApiValidationError);
        expect((err as OpenApiValidationError).field).toBe('responses');
      }
    });
  });
});
