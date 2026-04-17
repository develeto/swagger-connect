import { OpenApiValidationError } from '../errors/OpenApiError.js';
import type { ISchemaAdapter, AnySchema } from '../adapters/ISchemaAdapter.js';
import { RouteRegistry } from './RouteRegistry.js';
import type { RouteDefinition } from './RouteRegistry.js';
import { SchemaConverter } from './SchemaConverter.js';
import { assembleSpec } from './SpecAssembler.js';
import type {
  InfoObject,
  OpenApiDocument,
  SecurityRequirementObject,
  SecuritySchemeObject,
  ServerObject,
  TagObject,
} from '../types/openapi.types.js';

export interface DocBuilderOptions {
  info: InfoObject;
  /** Primary schema adapter. Additional adapters can be registered via `addAdapter()`. */
  adapter: ISchemaAdapter;
  servers?: ServerObject[];
  tags?: TagObject[];
  security?: SecurityRequirementObject[];
}

export class DocBuilder {
  private readonly registry = new RouteRegistry();
  private readonly adapters: ISchemaAdapter[];
  private readonly options: DocBuilderOptions;
  private readonly extraTags: TagObject[] = [];
  private readonly extraServers: ServerObject[] = [];
  private readonly securitySchemes: Record<string, SecuritySchemeObject> = {};
  private globalSecurity: SecurityRequirementObject[] | undefined;

  constructor(options: DocBuilderOptions) {
    if (!options.adapter) {
      throw new OpenApiValidationError(
        'DocBuilder requires at least one schema adapter. Pass `adapter` in the options.',
        'adapter',
      );
    }
    this.options = options;
    this.adapters = [options.adapter];
  }

  /** Register an additional schema adapter (e.g., to support multiple validators). */
  addAdapter(adapter: ISchemaAdapter): this {
    this.adapters.push(adapter);
    return this;
  }

  addRoute(route: RouteDefinition): this {
    this.registry.register(route);
    return this;
  }

  addRoutes(routes: RouteDefinition[]): this {
    for (const route of routes) {
      this.registry.register(route);
    }
    return this;
  }

  addTag(tag: TagObject): this {
    this.extraTags.push(tag);
    return this;
  }

  addSecurityScheme(name: string, scheme: SecuritySchemeObject): this {
    this.securitySchemes[name] = scheme;
    return this;
  }

  addServer(server: ServerObject): this {
    this.extraServers.push(server);
    return this;
  }

  withSecurity(security: SecurityRequirementObject[]): this {
    this.globalSecurity = security;
    return this;
  }

  /** Assembles and returns the OpenAPI 3.x document as a plain JavaScript object. */
  build(): OpenApiDocument {
    const converter = new SchemaConverter(this.adapters);

    const tags = [...(this.options.tags ?? []), ...this.extraTags];
    const servers = [...(this.options.servers ?? []), ...this.extraServers];
    const security = this.globalSecurity ?? this.options.security;

    return assembleSpec(this.registry.getRoutes(), converter, {
      info: this.options.info,
      ...(servers.length > 0 && { servers }),
      ...(tags.length > 0 && { tags }),
      ...(security !== undefined && { security }),
      ...(Object.keys(this.securitySchemes).length > 0 && {
        securitySchemes: this.securitySchemes,
      }),
    });
  }

  /** Returns the document serialized as an indented JSON string. */
  toJSON(): string {
    return JSON.stringify(this.build(), null, 2);
  }

  /**
   * Returns the document serialized as YAML.
   * Requires `js-yaml` to be installed as a peer dependency.
   */
  async toYAML(): Promise<string> {
    // Dynamic import keeps js-yaml as a true optional peer dep
    const { dump } = await import('js-yaml' as AnySchema as string) as { dump: (obj: unknown) => string };
    return dump(this.build());
  }
}
