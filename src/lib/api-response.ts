import { NextResponse } from 'next/server';

/** Standard success response: { success: true, ...data } */
export function ok<T extends Record<string, unknown>>(data: T, status = 200) {
  return NextResponse.json({ success: true as const, ...data }, { status });
}

/** Standard error response: { success: false, error } */
export function fail(error: string, status = 500) {
  return NextResponse.json({ success: false, error }, { status });
}

export function unauthorized(message = 'Unauthorized - Please sign in') {
  return fail(message, 401);
}

export function forbidden(message = 'Forbidden - Insufficient permissions') {
  return fail(message, 403);
}

export function badRequest(message: string) {
  return fail(message, 400);
}

export function notFound(message = 'Not found') {
  return fail(message, 404);
}

export function serverError(message = 'Internal server error') {
  return fail(message, 500);
}
