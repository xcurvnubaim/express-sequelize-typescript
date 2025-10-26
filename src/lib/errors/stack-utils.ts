import path from 'node:path';

export type StackFrame = {
  fn?: string;
  file?: string; // baseDir-stripped
  absFile?: string; // non-enumerable
  line?: number;
  column?: number;
  nodeInternal?: boolean;
  nodeModule?: boolean;
};

export type StackOptions = {
  baseDir?: string;
  includeNodeInternals?: boolean; // default false
  includeNodeModules?: boolean; // default true
  maxFrames?: number; // default 20
  // A function or constructor used to exclude frames up to this point when capturing stack traces
  // Avoid `Function` type per eslint: no-unsafe-function-type
  trimThisConstructor?: ((...args: unknown[]) => unknown) | (new (...args: unknown[]) => unknown);
};

export function getStackFrames(err: Error, opts: StackOptions = {}): StackFrame[] {
  const baseDir = opts.baseDir ?? process.cwd();
  const includeNodeInternals = opts.includeNodeInternals ?? false;
  const includeNodeModules = opts.includeNodeModules ?? true;
  const maxFrames = opts.maxFrames ?? 20;

  // Try V8 structured stack first
  const old = (Error as any).prepareStackTrace;
  (Error as any).prepareStackTrace = (_e: Error, structured: any) => structured;
  let sites: any[] | null = null;
  try {
    if (!err.stack) Error.captureStackTrace?.(err, opts.trimThisConstructor as any);
    const maybeSites = (err as any).stack;
    if (Array.isArray(maybeSites)) sites = maybeSites;
  } catch {
    // Intentionally ignore structured stack parsing failures
    void 0;
  }
  (Error as any).prepareStackTrace = old;

  if (sites && sites.length) {
    const out: StackFrame[] = [];
    for (const s of sites) {
      const abs: string | undefined = s.getFileName?.() || s.getScriptNameOrSourceURL?.();
      const isInternal =
        !abs || abs.startsWith('node:') || abs.includes(`${path.sep}internal${path.sep}`);
      if (isInternal && !includeNodeInternals) continue;

      const isNM = !!abs && abs.includes(`${path.sep}node_modules${path.sep}`);
      if (isNM && !includeNodeModules) continue;

      const frame: StackFrame = {
        fn: s.getFunctionName?.() ?? undefined,
        file: abs ? toRelative(abs, baseDir) : undefined,
        line: s.getLineNumber?.() ?? undefined,
        column: s.getColumnNumber?.() ?? undefined,
        nodeInternal: isInternal,
        nodeModule: isNM,
      };
      if (abs) defineHidden(frame, 'absFile', abs);
      out.push(frame);
      if (out.length >= maxFrames) break;
    }
    return out;
  }

  // Fallback: parse string stack (Bun, non-V8)
  const stackStr = String(err.stack ?? '');
  const lines = stackStr.split(/\r?\n/).slice(1); // skip "Error: msg"
  const frames: StackFrame[] = [];

  // Handles both forms:
  //   at fn (path/to/file.ts:12:34)
  //   at path/to/file.ts:12:34
  const re = /^\s*at\s+(?:(?<fn>[^(\s][^()]*)\s+\()?(?<loc>[^)]+)\)?\s*$/;

  for (const line of lines) {
    const m = re.exec(line);
    if (!m) continue;
    const fn = m.groups?.fn?.trim();
    const loc = m.groups?.loc?.trim() ?? '';

    // Extract file:line:column (strip URL prefixes)
    const cleaned = loc.replace(/^file:\/\//, '');
    const match = /(.+?):(\d+):(\d+)$/.exec(cleaned);
    if (!match) continue;

    const abs = match[1];
    const lineNo = Number(match[2]);
    const colNo = Number(match[3]);

    const isInternal =
      abs.startsWith('node:') ||
      abs.includes(`${path.sep}internal${path.sep}`) ||
      abs === '<anonymous>';
    if (isInternal && !includeNodeInternals) continue;

    const isNM = abs.includes(`${path.sep}node_modules${path.sep}`);
    if (isNM && !includeNodeModules) continue;

    const frame: StackFrame = {
      fn: fn || undefined,
      file: toRelative(abs, baseDir),
      line: lineNo,
      column: colNo,
      nodeInternal: isInternal,
      nodeModule: isNM,
    };
    defineHidden(frame, 'absFile', abs);
    frames.push(frame);
    if (frames.length >= maxFrames) break;
  }

  return frames;
}

function toRelative(abs: string, baseDir: string): string {
  const rel = path.relative(baseDir, abs);
  return rel && !rel.startsWith('..') ? rel : abs;
}
function defineHidden(obj: object, key: string, value: unknown) {
  Object.defineProperty(obj, key, { value, enumerable: false });
}
