// Builder
export { DocBuilder } from './builder/DocBuilder.js';
export type { DocBuilderOptions } from './builder/DocBuilder.js';

export { RouteRegistry } from './builder/RouteRegistry.js';
export type { RouteDefinition, HttpMethod } from './builder/RouteRegistry.js';

export { SchemaConverter } from './builder/SchemaConverter.js';

export { assembleSpec } from './builder/SpecAssembler.js';
export type { AssembleOptions } from './builder/SpecAssembler.js';

// Adapters
export type { ISchemaAdapter, AnySchema } from './adapters/ISchemaAdapter.js';

// Errors
export {
  OpenApiError,
  OpenApiAdapterError,
  OpenApiValidationError,
  OpenApiBuildError,
} from './errors/OpenApiError.js';

// Types
export type {
  OpenApiDocument,
  InfoObject,
  ServerObject,
  TagObject,
  PathsObject,
  PathItemObject,
  OperationObject,
  ParameterObject,
  ParameterIn,
  RequestBodyObject,
  ResponseObject,
  ResponsesObject,
  MediaTypeObject,
  SchemaObject,
  SchemaType,
  ComponentsObject,
  SecuritySchemeObject,
  SecurityRequirementObject,
  OAuthFlowsObject,
  OAuthFlowObject,
} from './types/openapi.types.js';
