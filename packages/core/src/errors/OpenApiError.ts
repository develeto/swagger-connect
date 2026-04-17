/** Base error for all swagger-connect errors. Always has a machine-readable `code`. */
export class OpenApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'OpenApiError';
    // Maintains proper prototype chain in transpiled ES5
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Thrown when a schema adapter cannot handle or convert a given schema. */
export class OpenApiAdapterError extends OpenApiError {
  constructor(
    message: string,
    public readonly adapterName: string,
  ) {
    super(message, 'ADAPTER_ERROR');
    this.name = 'OpenApiAdapterError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Thrown when a RouteDefinition contains invalid or missing values. */
export class OpenApiValidationError extends OpenApiError {
  constructor(
    message: string,
    public readonly field: string,
  ) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'OpenApiValidationError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Thrown when the SpecAssembler fails to produce a valid document. */
export class OpenApiBuildError extends OpenApiError {
  constructor(message: string) {
    super(message, 'BUILD_ERROR');
    this.name = 'OpenApiBuildError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
