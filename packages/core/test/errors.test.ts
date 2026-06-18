import { describe, it, expect } from 'vitest';

import {
  OpenApiError,
  OpenApiAdapterError,
  OpenApiValidationError,
  OpenApiBuildError,
} from '../src/errors/OpenApiError.js';

describe('OpenApiError', () => {
  it('sets name, message and code', () => {
    const err = new OpenApiError('something failed', 'TEST_CODE');
    expect(err.name).toBe('OpenApiError');
    expect(err.message).toBe('something failed');
    expect(err.code).toBe('TEST_CODE');
    expect(err).toBeInstanceOf(Error);
  });
});

describe('OpenApiAdapterError', () => {
  it('sets name, code and adapterName', () => {
    const err = new OpenApiAdapterError('bad schema', 'my-adapter');
    expect(err.name).toBe('OpenApiAdapterError');
    expect(err.code).toBe('ADAPTER_ERROR');
    expect(err.adapterName).toBe('my-adapter');
    expect(err).toBeInstanceOf(OpenApiError);
  });
});

describe('OpenApiValidationError', () => {
  it('sets name, code and field', () => {
    const err = new OpenApiValidationError('invalid path', 'path');
    expect(err.name).toBe('OpenApiValidationError');
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.field).toBe('path');
    expect(err).toBeInstanceOf(OpenApiError);
  });
});

describe('OpenApiBuildError', () => {
  it('sets name and code', () => {
    const err = new OpenApiBuildError('build failed');
    expect(err.name).toBe('OpenApiBuildError');
    expect(err.code).toBe('BUILD_ERROR');
    expect(err).toBeInstanceOf(OpenApiError);
  });
});
