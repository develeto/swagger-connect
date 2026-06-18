import { OpenApiBuildError } from '../errors/OpenApiError.js';
import type { RouteDefinition } from './RouteRegistry.js';
import type { SchemaConverter } from './SchemaConverter.js';
import type {
  ComponentsObject,
  InfoObject,
  MediaTypeObject,
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

/**
 * Walks the assembled document and extracts schemas with a `title` into
 * `components.schemas`, replacing inline occurrences with `$ref` pointers.
 *
 * This enables adapters to produce named schemas that are automatically
 * deduplicated and referenced throughout the document.
 */
function extractNamedComponents(doc: OpenApiDocument): void {
  const schemas: Record<string, SchemaObject> = {};

  function extract(schema: SchemaObject): void {
    if (!schema || schema.$ref !== undefined) return;

    if (schema.title !== undefined) {
      const name = schema.title;
      if (!schemas[name]) {
        const { title: _t, ...rest } = schema;
        schemas[name] = rest;
      }
      // Replace with $ref
      for (const key of Object.keys(schema)) {
        delete (schema as Record<string, unknown>)[key];
      }
      schema.$ref = `#/components/schemas/${name}`;
      return;
    }

    // Recurse into composition and container fields
    if (schema.properties !== undefined) {
      for (const prop of Object.values(schema.properties)) {
        extract(prop);
      }
    }
    if (schema.items !== undefined) {
      extract(schema.items);
    }
    if (schema.additionalProperties !== undefined && typeof schema.additionalProperties === 'object') {
      extract(schema.additionalProperties);
    }
    for (const key of ['allOf', 'anyOf', 'oneOf'] as const) {
      const arr = schema[key];
      if (arr !== undefined) {
        for (const item of arr) {
          extract(item);
        }
      }
    }
    if (schema.not !== undefined) {
      extract(schema.not);
    }
  }

  function extractMedia(media: MediaTypeObject): void {
    if (media.schema !== undefined) {
      extract(media.schema);
    }
  }

  for (const pathItem of Object.values(doc.paths)) {
    for (const method of ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'] as const) {
      const op = (pathItem as Record<string, unknown>)[method] as OperationObject | undefined;
      if (op === undefined) continue;

      if (op.parameters !== undefined) {
        for (const param of op.parameters) {
          if (param.schema !== undefined) extract(param.schema);
        }
      }

      if (op.requestBody !== undefined) {
        for (const media of Object.values(op.requestBody.content)) {
          extractMedia(media);
        }
      }

      for (const response of Object.values(op.responses)) {
        if (response.content !== undefined) {
          for (const media of Object.values(response.content)) {
            extractMedia(media);
          }
        }
      }
    }
  }

  if (Object.keys(schemas).length > 0) {
    if (doc.components === undefined) {
      doc.components = {};
    }
    doc.components.schemas = {
      ...doc.components.schemas,
      ...schemas,
    };
  }
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

  // Post-process: extract named schemas to components.schemas
  extractNamedComponents(doc);

  return doc;
}
