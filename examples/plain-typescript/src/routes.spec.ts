import type { RouteDefinition } from '@swagger-connect/core';
import { z } from 'zod';

// ── Shared schemas ────────────────────────────────────────────────────────────

const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  createdAt: z.string().datetime(),
});

const CreateUserBody = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
});

const UpdateUserBody = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
});

const ErrorSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
});

const UserIdParams = z.object({
  id: z.string().uuid(),
});

const ListUsersQuery = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
});

// ── Routes ────────────────────────────────────────────────────────────────────

export const routes: RouteDefinition[] = [
  {
    method: 'GET',
    path: '/users',
    summary: 'List all users',
    description: 'Returns a paginated list of users.',
    tags: ['Users'],
    queryParams: ListUsersQuery,
    responses: {
      200: z.object({
        data: z.array(UserSchema),
        total: z.number().int(),
      }),
    },
  },
  {
    method: 'POST',
    path: '/users',
    summary: 'Create a user',
    tags: ['Users'],
    requestBody: CreateUserBody,
    responses: {
      201: UserSchema,
      400: ErrorSchema,
      409: ErrorSchema,
    },
  },
  {
    method: 'GET',
    path: '/users/{id}',
    summary: 'Get a user by ID',
    tags: ['Users'],
    pathParams: UserIdParams,
    responses: {
      200: UserSchema,
      404: ErrorSchema,
    },
  },
  {
    method: 'PATCH',
    path: '/users/{id}',
    summary: 'Update a user',
    tags: ['Users'],
    pathParams: UserIdParams,
    requestBody: UpdateUserBody,
    responses: {
      200: UserSchema,
      400: ErrorSchema,
      404: ErrorSchema,
    },
  },
  {
    method: 'DELETE',
    path: '/users/{id}',
    summary: 'Delete a user',
    tags: ['Users'],
    pathParams: UserIdParams,
    responses: {
      204: {
        description: 'User deleted successfully',
      },
      404: ErrorSchema,
    },
  },
];
