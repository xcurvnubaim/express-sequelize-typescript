import { container } from "tsyringe";
import type { Logger } from "../app/logger";
import { getStackFrames, type StackFrame } from "./stack-utils";
import { TOKENS } from "../app/di-tokens";

export interface ApiErrorJson {
  statusCode: number;
  message: string;
  stackFrames?: StackFrame[]; // array instead of string
}

export class ApiErrorClass extends Error {
  public readonly statusCode: number;
  private readonly _stackFrames: StackFrame[];
  private logger: Logger;

  constructor(
    message: string,
    statusCode = 500,
    opts?: {
      // no public 'cause'—we avoid leaking sub-errors
      // (You can still log/attach it server-side if needed.)
      cause?: unknown;
      code?: string;
      context?: Record<string, unknown>;
      stackOptions?: Parameters<typeof getStackFrames>[1];
    }
  ) {
    super(message);
    this.name = "ApiError";
    this.logger = container.resolve<Logger>(TOKENS.Logger);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);

    // capture frames and strip base paths now
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiErrorClass);
    }
    this._stackFrames = getStackFrames(this, {
      trimThisConstructor: ApiErrorClass,
      includeNodeInternals: false,
      includeNodeModules: true,
      ...(opts?.stackOptions ?? {}),
    });

    // optional non-enumerable hints for logs
    if (opts?.code) defineHidden(this, "code", opts.code);
    if (opts?.context) defineHidden(this, "context", opts.context);

    // DO NOT merge `cause` into JSON; if you want to add cause info to logs,
    // do it in your logger (not here). We intentionally don't persist it.
    if (opts?.cause) this.logger.error(opts.cause as Error);
  }

  get stackFrames(): StackFrame[] {
    return this._stackFrames;
  }

  // Minimal JSON: no raw stack string; only structured frames
  toJSON(includeFrames = process.env.NODE_ENV !== "production"): ApiErrorJson {
    const out: ApiErrorJson = {
      statusCode: this.statusCode,
      message: this.message,
    };
    if (includeFrames) out.stackFrames = this._stackFrames;
    return out;
  }

  // Helpful normalizer at boundaries
  static from(
    err: unknown,
    fallbackStatus = 500,
    overrideMsg?: string,
    stackOptions?: Parameters<typeof getStackFrames>[1]
  ): ApiErrorClass {
    if (err instanceof ApiErrorClass) return err;
    const base =
      err instanceof Error
        ? err
        : new Error(typeof err === "string" ? err : JSON.stringify(err));
    return new ApiErrorClass(
      overrideMsg ?? base.message ?? "Internal Server Error",
      (err as any)?.statusCode ?? fallbackStatus,
      { stackOptions }
    );
  }
}

function defineHidden(obj: object, key: string, value: unknown) {
  Object.defineProperty(obj, key, {
    value,
    enumerable: false,
    configurable: true,
    writable: true,
  });
}