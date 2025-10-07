// utils/parseQueryFromRequest.ts
import { type Request } from "express";
import { type BuildQueryOptions } from "./sequelizeQuery";

export function parseQueryFromRequest(req: Request): BuildQueryOptions {
  const {
    page,
    pageSize,
    sortBy,
    sortDir,
    q,
    cursor,
    cursorField,
    direction,
    mode,
    ...rest
  } = req.query;

  // Pagination
  const pagination =
    mode === "cursor"
      ? {
          mode: "cursor" as const,
          cursor: cursor as string | undefined,
          cursorField: (cursorField as string) || undefined,
          direction: (direction as "next" | "prev") || "next",
          pageSize: Number(pageSize) || 20,
        }
      : {
          mode: "offset" as const,
          page: Number(page) || 1,
          pageSize: Number(pageSize) || 20,
        };

  // Sort
  const sort = {
    sortBy: (sortBy as string) || undefined,
    sortDir: (sortDir as "asc" | "desc") || "asc",
    allowlist: [], // set this later manually for safety
  };

  // Search
  const search = q
    ? {
        q: q as string,
        columns: [], // you define columns later per controller
        dialect: "postgres" as const,
      }
    : undefined;

  // Filters: auto-parse operators like created_at[gte]=2024-01-01
  const equals: Record<string, any> = {};
  const range: Record<string, any> = {};
  const contains: Record<string, any> = {};

  for (const [key, value] of Object.entries(rest)) {
    const match = key.match(/^(.+)\[(gte|lte|gt|lt|between|contains)\]$/);
    if (match) {
      const [, field, op] = match;
      switch (op) {
        case "contains":
          contains[field] = value;
          break;
        case "between":
          range[field] = { between: String(value).split(",") };
          break;
        default:
          range[field] = { ...(range[field] || {}), [op]: value };
          break;
      }
    } else {
      equals[key] = value;
    }
  }

  const filters = {
    equals,
    range: Object.keys(range).length ? range : undefined,
    contains: Object.keys(contains).length ? contains : undefined,
  };

  return { pagination, sort, search, filters };
}
