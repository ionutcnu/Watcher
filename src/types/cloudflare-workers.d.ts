/**
 * Cloudflare Workers type definitions
 * Provides global types for D1, scheduled events, and execution context
 */

declare global {
  // Cloudflare D1 Database types
  interface D1Database {
    prepare(query: string): D1PreparedStatement;
    dump(): Promise<ArrayBuffer>;
    batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
    exec(query: string): Promise<D1ExecResult>;
  }

  interface D1PreparedStatement {
    bind(...values: unknown[]): D1PreparedStatement;
    first<T = unknown>(colName?: string): Promise<T | null>;
    run<T = unknown>(): Promise<D1Result<T>>;
    all<T = unknown>(): Promise<D1Result<T>>;
    raw<T = unknown>(): Promise<T[]>;
  }

  interface D1Result<T = unknown> {
    results?: T[];
    success: boolean;
    meta: {
      duration: number;
      size_after: number;
      rows_read: number;
      rows_written: number;
      last_row_id: number;
      changed_db: boolean;
      changes: number;
    };
    error?: string;
  }

  interface D1ExecResult {
    count: number;
    duration: number;
  }

  // Cloudflare Workers scheduled event types
  interface ScheduledEvent {
    readonly scheduledTime: number;
    readonly cron: string;
    waitUntil(promise: Promise<unknown>): void;
  }

  // Cloudflare Workers execution context
  interface ExecutionContext {
    waitUntil(promise: Promise<unknown>): void;
    passThroughOnException(): void;
  }

  // Cloudflare Workers exported handler type
  interface ExportedHandler<Env = unknown> {
    fetch?: (request: Request, env: Env, ctx: ExecutionContext) => Promise<Response> | Response;
    scheduled?: (event: ScheduledEvent, env: Env, ctx: ExecutionContext) => Promise<void> | void;
    queue?: (batch: unknown, env: Env, ctx: ExecutionContext) => Promise<void> | void;
    trace?: (traces: unknown[], env: Env, ctx: ExecutionContext) => Promise<void> | void;
  }
}

export {};
