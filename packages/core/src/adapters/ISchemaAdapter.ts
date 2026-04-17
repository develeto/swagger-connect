import type { SchemaObject } from '../types/openapi.types.js';

/**
 * Opaque type representing any schema from any supported validator.
 * Intentionally `unknown` — each adapter narrows it internally.
 */
export type AnySchema = unknown;

/**
 * Contract that every schema adapter must implement.
 * Implement this interface to add support for any validation library.
 */
export interface ISchemaAdapter {
  /** Human-readable adapter name. Used in error messages. */
  readonly name: string;

  /**
   * Returns true if this adapter knows how to convert the given schema.
   * Allows multiple adapters to coexist — the first matching adapter wins.
   */
  canHandle(schema: AnySchema): boolean;

  /**
   * Converts the schema to an OpenAPI 3.x Schema Object.
   * Must throw `OpenApiAdapterError` if conversion fails.
   */
  convert(schema: AnySchema): SchemaObject;
}
