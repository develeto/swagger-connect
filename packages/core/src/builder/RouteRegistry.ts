import type { AnySchema } from '../adapters/ISchemaAdapter.js';
import { OpenApiValidationError } from '../errors/OpenApiError.js';
import type { ResponseObject, SecurityRequirementObject } from '../types/openapi.types.js';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface RouteDefinition {
  method: HttpMethod;
  /** OpenAPI path format: /users/{id} */
  path: string;
  summary?: string;
  description?: string;
  tags?: string[];
  operationId?: string;
  deprecated?: boolean;
  security?: SecurityRequirementObject[];
  pathParams?: AnySchema;
  queryParams?: AnySchema;
  headers?: AnySchema;
  requestBody?: AnySchema;
  responses: Record<number, AnySchema | ResponseObject>;
}

const VALID_METHODS = new Set<HttpMethod>([
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
]);

// OpenAPI path must start with / and braces must be balanced
const PATH_REGEX = /^\/[^\s]*$/;

function validateRoute(route: RouteDefinition): void {
  if (!VALID_METHODS.has(route.method)) {
    throw new OpenApiValidationError(
      `Invalid HTTP method "${route.method}". Must be one of: ${[...VALID_METHODS].join(', ')}.`,
      'method',
    );
  }

  if (!PATH_REGEX.test(route.path)) {
    throw new OpenApiValidationError(
      `Invalid path "${route.path}". Path must start with "/" and contain no whitespace.`,
      'path',
    );
  }

  const openBraces = (route.path.match(/\{/g) ?? []).length;
  const closeBraces = (route.path.match(/\}/g) ?? []).length;
  if (openBraces !== closeBraces) {
    throw new OpenApiValidationError(
      `Invalid path "${route.path}". Unbalanced curly braces in path parameters.`,
      'path',
    );
  }

  if (!route.responses || Object.keys(route.responses).length === 0) {
    throw new OpenApiValidationError(
      `Route "${route.method} ${route.path}" must define at least one response.`,
      'responses',
    );
  }
}

export class RouteRegistry {
  private readonly routes: RouteDefinition[] = [];

  register(route: RouteDefinition): void {
    validateRoute(route);
    this.routes.push(route);
  }

  getRoutes(): ReadonlyArray<RouteDefinition> {
    return this.routes;
  }
}
