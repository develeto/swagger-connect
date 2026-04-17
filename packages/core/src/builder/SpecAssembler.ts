import { OpenApiBuildError } from '../errors/OpenApiError.js';
import type { RouteDefinition } from './RouteRegistry.js';
import type { SchemaConverter } from './SchemaConverter.js';
import type {
  ComponentsObject,
  InfoObject,
  OpenApiDocument,
  OperationObject,
  ParameterObject,
  PathItemObject,
  PathsObject,
  RequestBodyObject,
  ResponseObject,
  ResponsesObject,
  SchemaObject,
  SecurityRequirementObject,
  SecuritySchemeObject,
  ServerObject,
  TagObject,
} from '../types/openapi.types.js';

export interface AssembleOptions {
  info: InfoObject;
  servers?: ServerObject[];
  tags?: TagObject[];
  security?: SecurityRequirementObject[];
  securitySchemes?: Record<string, SecuritySchemeObject>;
}

function isResponseObject(value: unknown): value is ResponseObject {
  return (
    typeof value === 'object' &&
    value !== null &&
    'description' in value &&
    typeof (value as ResponseObject).description === 'string'
  );
}

function buildParameters(
  schema: unknown,
  inLocation: 'path' | 'query' | 'header',
  converter: SchemaConverter,
): ParameterObject[] {
  const schemaObj = converter.convert(schema);
  if (schemaObj.type !== 'object' || !schemaObj.properties) {
    return [];
  }

  const required = new Set(schemaObj.required ?? []);

  return Object.entries(schemaObj.properties).map(([name, propSchema]) => ({
    name,
    in: inLocation,
    required: inLocation === 'path' ? true : required.has(name),
    schema: propSchema,
    ...(propSchema.description !== undefined && { description: propSchema.description }),
  }));
}

function buildOperation(route: RouteDefinition, converter: SchemaConverter): OperationObject {
  const parameters: ParameterObject[] = [];

  if (route.pathParams !== undefined) {
    parameters.push(...buildParameters(route.pathParams, 'path', converter));
  }
  if (route.queryParams !== undefined) {
    parameters.push(...buildParameters(route.queryParams, 'query', converter));
  }
  if (route.headers !== undefined) {
    parameters.push(...buildParameters(route.headers, 'header', converter));
  }

  let requestBody: RequestBodyObject | undefined;
  if (route.requestBody !== undefined) {
    const bodySchema = converter.convert(route.requestBody);
    requestBody = {
      required: true,
      content: {
        'application/json': { schema: bodySchema },
      },
    };
  }

  const responses: ResponsesObject = {};
  for (const [statusCode, responseSchema] of Object.entries(route.responses)) {
    if (isResponseObject(responseSchema)) {
      responses[statusCode] = responseSchema;
    } else {
      const schema: SchemaObject = converter.convert(responseSchema);
      responses[statusCode] = {
        description: getDefaultDescription(Number(statusCode)),
        content: {
          'application/json': { schema },
        },
      };
    }
  }

  const operation: OperationObject = {
    responses,
    ...(route.summary !== undefined && { summary: route.summary }),
    ...(route.description !== undefined && { description: route.description }),
    ...(route.tags !== undefined && route.tags.length > 0 && { tags: route.tags }),
    ...(route.operationId !== undefined && { operationId: route.operationId }),
    ...(route.deprecated === true && { deprecated: true }),
    ...(route.security !== undefined && { security: route.security }),
    ...(parameters.length > 0 && { parameters }),
    ...(requestBody !== undefined && { requestBody }),
  };

  return operation;
}

function getDefaultDescription(status: number): string {
  const descriptions: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    500: 'Internal Server Error',
  };
  return descriptions[status] ?? 'Response';
}

export function assembleSpec(
  routes: ReadonlyArray<RouteDefinition>,
  converter: SchemaConverter,
  options: AssembleOptions,
): OpenApiDocument {
  if (!options.info.title?.trim()) {
    throw new OpenApiBuildError('`info.title` is required and cannot be empty.');
  }
  if (!options.info.version?.trim()) {
    throw new OpenApiBuildError('`info.version` is required and cannot be empty.');
  }

  const paths: PathsObject = {};

  for (const route of routes) {
    const path = route.path;
    if (!paths[path]) {
      paths[path] = {};
    }

    const pathItem = paths[path] as PathItemObject;
    const method = route.method.toLowerCase() as keyof PathItemObject;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (pathItem as any)[method] = buildOperation(route, converter);
    } catch (err) {
      throw new OpenApiBuildError(
        `Failed to build operation for "${route.method} ${route.path}": ${(err as Error).message}`,
      );
    }
  }

  const components: ComponentsObject = {};
  if (options.securitySchemes && Object.keys(options.securitySchemes).length > 0) {
    components.securitySchemes = options.securitySchemes;
  }

  const doc: OpenApiDocument = {
    openapi: '3.0.3',
    info: options.info,
    paths,
    ...(options.servers !== undefined &&
      options.servers.length > 0 && { servers: options.servers }),
    ...(options.tags !== undefined && options.tags.length > 0 && { tags: options.tags }),
    ...(options.security !== undefined && { security: options.security }),
    ...(Object.keys(components).length > 0 && { components }),
  };

  return doc;
}
