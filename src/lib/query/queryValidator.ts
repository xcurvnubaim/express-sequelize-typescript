// utils/validateQueryParams.ts
import { ApiErrorClass } from '../errors/api-error';
import type { BuildQueryOptions, FilterConfig, Primitive } from './sequelizeQuery';

type RangeOps = 'gte' | 'lte' | 'gt' | 'lt' | 'between';

export type FilterRule = {
  /**
   * Field name in DB / model (e.g. "created_at", "role", "name")
   */
  field: string;
  /**
   * Which operators are allowed for this field.
   * Example:
   *   { equals: true }
   *   { contains: true }
   *   { range: { gte: true, lte: true, between: true } }
   */
  allow: {
    equals?: boolean;
    contains?: boolean;
    range?: Partial<Record<RangeOps, boolean>>;
  };
  /**
   * Optional custom validator per operator to enforce value type/shape.
   * Return true if valid, false (or throw) if invalid.
   */
  validate?: Partial<{
    equals: (v: Primitive | Primitive[]) => boolean;
    contains: (v: string | string[]) => boolean;
    range: (v: Record<string, any>) => boolean;
  }>;
};

export type ValidateFields = {
  sortColumns?: string[]; // whitelist for sortBy
  sortDir?: ('asc' | 'desc')[]; // optional whitelist for sortDir
  searchColumns?: string[]; // whitelist for search columns
  filters?: FilterRule[]; // per-field filter rules
  maxPageSize?: number; // default 200
  minPageSize?: number; // default 1
};

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === 'string');

const isPrimitiveArray = (v: unknown): v is Primitive[] =>
  Array.isArray(v) &&
  v.every((x) => ['string', 'number', 'boolean'].includes(typeof x) || x == null);

/**
 * Returns a sanitized copy of baseOpts if valid, or throws ApiErrorClass(400).
 */
export function validateQueryParams(
  baseOpts: BuildQueryOptions,
  cfg: ValidateFields
): BuildQueryOptions {
  const errors: string[] = [];
  const sanitized: BuildQueryOptions = {
    pagination: baseOpts.pagination ? { ...baseOpts.pagination } : undefined,
    sort: baseOpts.sort ? { ...baseOpts.sort } : undefined,
    search: baseOpts.search ? { ...baseOpts.search } : undefined,
    filters: baseOpts.filters
      ? (JSON.parse(JSON.stringify(baseOpts.filters)) as FilterConfig)
      : undefined, // deep-ish copy
    defaultOrder: baseOpts.defaultOrder ? [...baseOpts.defaultOrder] : undefined,
  };

  // ---- Pagination ----
  const maxPS = cfg.maxPageSize ?? 200;
  const minPS = cfg.minPageSize ?? 1;

  if (sanitized.pagination?.mode === 'cursor') {
    const ps = Number((sanitized.pagination as any).pageSize ?? 20);
    (sanitized.pagination as any).pageSize = clamp(ps, minPS, maxPS);
  } else if (sanitized.pagination) {
    const page = Math.max(Number((sanitized.pagination as any).page ?? 1), 1);
    const pageSize = clamp(Number((sanitized.pagination as any).pageSize ?? 20), minPS, maxPS);
    (sanitized.pagination as any).page = page;
    (sanitized.pagination as any).pageSize = pageSize;
  }

  // ---- Sort ----
  if (sanitized.sort?.sortBy) {
    const allowed = cfg.sortColumns ?? [];
    if (!allowed.includes(sanitized.sort.sortBy)) {
      errors.push(`Invalid sort column: ${sanitized.sort.sortBy}`);
    }
  }
  if (sanitized.sort?.sortDir) {
    const dir = sanitized.sort.sortDir.toLowerCase() as 'asc' | 'desc';
    if (cfg.sortDir && !cfg.sortDir.includes(dir)) {
      errors.push(`Invalid sort direction: ${sanitized.sort.sortDir}`);
    } else if (dir !== 'asc' && dir !== 'desc') {
      errors.push(`Invalid sort direction: ${sanitized.sort.sortDir}`);
    } else {
      sanitized.sort.sortDir = dir;
    }
  }
  // Remove user-provided allowlist (always set by server)
  if (sanitized.sort) delete (sanitized.sort as any).allowlist;

  // ---- Search ----
  if (sanitized.search?.q) {
    if (!cfg.searchColumns || cfg.searchColumns.length === 0) {
      // If no whitelist provided, strip columns (controller will set later)
      sanitized.search.columns = [];
    } else {
      const requested = sanitized.search.columns ?? [];
      if (requested.length === 0) {
        // If client didn't set, use server whitelist
        sanitized.search.columns = [...cfg.searchColumns];
      } else {
        // Ensure requested ⊆ whitelist
        const bad = requested.filter((c) => !cfg.searchColumns!.includes(c));
        if (bad.length) errors.push(`Invalid search columns: ${bad.join(', ')}`);
        sanitized.search.columns = requested.filter((c) => cfg.searchColumns!.includes(c));
      }
    }
  } else if (sanitized.search) {
    // No q => ignore search
    delete sanitized.search;
  }

  // ---- Filters ----
  if (sanitized.filters && cfg.filters?.length) {
    const byField = new Map<string, FilterRule>();
    cfg.filters.forEach((r) => byField.set(r.field, r));

    // equals
    if (sanitized.filters.equals) {
      for (const [field, val] of Object.entries(sanitized.filters.equals)) {
        const rule = byField.get(field);
        if (!rule || !rule.allow.equals) {
          errors.push(`Filtering not allowed on field "${field}" with operator "equals"`);
          delete (sanitized.filters.equals as any)[field];
          continue;
        }
        const ok = Array.isArray(val) ? isPrimitiveArray(val) : true; // single primitive OK
        if (!ok) errors.push(`Invalid value for equals(${field})`);
        if (rule.validate?.equals && !rule.validate.equals(val as any)) {
          errors.push(`Custom validation failed for equals(${field})`);
        }
      }
      if (Object.keys(sanitized.filters.equals).length === 0) delete sanitized.filters.equals;
    }

    // contains (LIKE/ILIKE)
    if (sanitized.filters.contains) {
      for (const [field, val] of Object.entries(sanitized.filters.contains)) {
        const rule = byField.get(field);
        if (!rule || !rule.allow.contains) {
          errors.push(`Filtering not allowed on field "${field}" with operator "contains"`);
          delete (sanitized.filters.contains as any)[field];
          continue;
        }
        const ok = typeof val === 'string' || isStringArray(val);
        if (!ok) errors.push(`Invalid value for contains(${field})`);
        if (rule.validate?.contains && !rule.validate.contains(val as any)) {
          errors.push(`Custom validation failed for contains(${field})`);
        }
      }
      if (Object.keys(sanitized.filters.contains).length === 0) delete sanitized.filters.contains;
    }

    // range (gte/lte/gt/lt/between)
    if (sanitized.filters.range) {
      for (const [field, cfgVal] of Object.entries(sanitized.filters.range)) {
        const rule = byField.get(field);
        if (!rule || !rule.allow.range) {
          errors.push(`Filtering not allowed on field "${field}" with operator "range"`);
          delete (sanitized.filters.range as any)[field];
          continue;
        }

        const allowedOps = rule.allow.range;
        const obj = cfgVal as Record<string, any>;

        for (const [op, v] of Object.entries(obj)) {
          if (!isRangeOp(op)) {
            errors.push(`Invalid range operator for ${field}: ${op}`);
            delete obj[op];
            continue;
          }
          if (!allowedOps?.[op as RangeOps]) {
            errors.push(`Range operator not allowed for ${field}: ${op}`);
            delete obj[op];
            continue;
          }
          if (op === 'between') {
            const arr = v as any[];
            if (!Array.isArray(arr) || arr.length !== 2) {
              errors.push(`between(${field}) requires an array of exactly 2 values`);
              delete obj[op];
              continue;
            }
          }
        }

        if (rule.validate?.range && !rule.validate.range(obj)) {
          errors.push(`Custom validation failed for range(${field})`);
        }

        if (Object.keys(obj).length === 0) {
          delete (sanitized.filters.range as any)[field];
        } else {
          (sanitized.filters.range as any)[field] = obj;
        }
      }
      if (Object.keys(sanitized.filters.range).length === 0) delete sanitized.filters.range;
    }

    // raw: never allow from user
    if (sanitized.filters.raw) delete sanitized.filters.raw;

    // Drop empty filters object
    if (!sanitized.filters.equals && !sanitized.filters.contains && !sanitized.filters.range) {
      delete sanitized.filters;
    }
  } else if (sanitized.filters) {
    // If server gave no filter rules, strip user filters for safety
    delete sanitized.filters;
  }

  if (errors.length) {
    throw new ApiErrorClass('Failed to validate request: ' + errors.join('; '), 400);
  }

  return sanitized;
}

// helpers
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function isRangeOp(op: string): op is RangeOps {
  return op === 'gte' || op === 'lte' || op === 'gt' || op === 'lt' || op === 'between';
}
