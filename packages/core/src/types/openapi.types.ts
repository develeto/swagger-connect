// OpenAPI 3.0.x type definitions — no external dependencies

export interface OpenApiDocument {
  openapi: '3.0.3';
  info: InfoObject;
  servers?: ServerObject[];
  paths: PathsObject;
  components?: ComponentsObject;
  tags?: TagObject[];
  security?: SecurityRequirementObject[];
}

export interface InfoObject {
  title: string;
  version: string;
  description?: string;
  termsOfService?: string;
  contact?: ContactObject;
  license?: LicenseObject;
}

export interface ContactObject {
  name?: string;
  url?: string;
  email?: string;
}

export interface LicenseObject {
  name: string;
  url?: string;
}

export interface ServerObject {
  url: string;
  description?: string;
  variables?: Record<string, ServerVariableObject>;
}

export interface ServerVariableObject {
  enum?: string[];
  default: string;
  description?: string;
}

export interface TagObject {
  name: string;
  description?: string;
}

// Paths

export type PathsObject = Record<string, PathItemObject>;

export interface PathItemObject {
  summary?: string;
  description?: string;
  get?: OperationObject;
  put?: OperationObject;
  post?: OperationObject;
  delete?: OperationObject;
  options?: OperationObject;
  head?: OperationObject;
  patch?: OperationObject;
  parameters?: ParameterObject[];
}

export interface OperationObject {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  deprecated?: boolean;
  security?: SecurityRequirementObject[];
  parameters?: ParameterObject[];
  requestBody?: RequestBodyObject;
  responses: ResponsesObject;
}

// Parameters

export type ParameterIn = 'path' | 'query' | 'header' | 'cookie';

export interface ParameterObject {
  name: string;
  in: ParameterIn;
  required?: boolean;
  description?: string;
  deprecated?: boolean;
  schema?: SchemaObject;
}

// Request & Response

export interface RequestBodyObject {
  description?: string;
  required?: boolean;
  content: Record<string, MediaTypeObject>;
}

export type ResponsesObject = Record<string, ResponseObject>;

export interface ResponseObject {
  description: string;
  content?: Record<string, MediaTypeObject>;
  headers?: Record<string, HeaderObject>;
}

export interface MediaTypeObject {
  schema?: SchemaObject;
}

export interface HeaderObject {
  description?: string;
  schema?: SchemaObject;
}

// Schema

export type SchemaType = 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object' | 'null';

export interface SchemaObject {
  type?: SchemaType | SchemaType[];
  title?: string;
  description?: string;
  format?: string;
  default?: unknown;
  example?: unknown;
  enum?: unknown[];
  const?: unknown;
  nullable?: boolean;

  // String
  minLength?: number;
  maxLength?: number;
  pattern?: string;

  // Number
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number | boolean;
  exclusiveMaximum?: number | boolean;
  multipleOf?: number;

  // Array
  items?: SchemaObject;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;

  // Object
  properties?: Record<string, SchemaObject>;
  required?: string[];
  additionalProperties?: boolean | SchemaObject;
  minProperties?: number;
  maxProperties?: number;

  // Composition
  allOf?: SchemaObject[];
  anyOf?: SchemaObject[];
  oneOf?: SchemaObject[];
  not?: SchemaObject;

  // Reference
  $ref?: string;
}

// Components

export interface ComponentsObject {
  schemas?: Record<string, SchemaObject>;
  responses?: Record<string, ResponseObject>;
  parameters?: Record<string, ParameterObject>;
  requestBodies?: Record<string, RequestBodyObject>;
  securitySchemes?: Record<string, SecuritySchemeObject>;
}

// Security

export type SecurityRequirementObject = Record<string, string[]>;

export type SecuritySchemeType = 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';

export interface SecuritySchemeObject {
  type: SecuritySchemeType;
  description?: string;
  name?: string;
  in?: 'query' | 'header' | 'cookie';
  scheme?: string;
  bearerFormat?: string;
  flows?: OAuthFlowsObject;
  openIdConnectUrl?: string;
}

export interface OAuthFlowsObject {
  implicit?: OAuthFlowObject;
  password?: OAuthFlowObject;
  clientCredentials?: OAuthFlowObject;
  authorizationCode?: OAuthFlowObject;
}

export interface OAuthFlowObject {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes: Record<string, string>;
}
