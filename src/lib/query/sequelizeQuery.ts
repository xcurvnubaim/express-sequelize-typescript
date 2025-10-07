// utils/sequelizeQuery.ts
import { type FindOptions, Op, type WhereOptions, type OrderItem, type col, type fn, type literal } from "sequelize";

export type Pagination = { page?: number; pageSize?: number } & (
  | { mode?: "offset"; }                    // default
  | { mode: "cursor"; cursor?: string | number; cursorField?: string; direction?: "next" | "prev" }
);

export type Sort = {
  sortBy?: string;            // e.g. "created_at"
  sortDir?: "asc" | "desc";
  // Only allow sorting by these columns to avoid SQL injection
  allowlist?: readonly string[];
};

export type Search = {
  q?: string;
  // columns to search (fully qualified if needed: "user.name")
  columns?: readonly string[];
  // For MySQL use Op.like; for Postgres prefer Op.iLike (case-insensitive)
  dialect?: "postgres" | "mysql" | "sqlite" | "mariadb";
};

export type Primitive = string | number | boolean | null | undefined;

export type FilterConfig = {
  // exact match filters (value -> where[field] = value)
  equals?: Record<string, Primitive | Primitive[]>;
  // partial match filters (LIKE/ILIKE)
  contains?: Record<string, string | string[]>;
  // ranges: { gte?: v, lte?: v, gt?: v, lt?: v, between?: [a,b] }
  range?: Record<
    string,
    | { gte?: number | string; lte?: number | string; gt?: number | string; lt?: number | string }
    | { between?: [number | string, number | string] }
  >;
  // custom raw where pieces if you really need them (use sparingly)
  raw?: WhereOptions;
};

export type BuildQueryOptions = {
  pagination?: Pagination;
  sort?: Sort;
  search?: Search;
  filters?: FilterConfig;
  // default order if none provided
  defaultOrder?: OrderItem[];
};

export function buildSequelizeQuery(opts: BuildQueryOptions): Pick<FindOptions, "where" | "order" | "limit" | "offset"> & {
  cursorClause?: WhereOptions;
  cursorOrder?: OrderItem[];
} {
  const where: WhereOptions = {};

  // ----- filters -----
  const f = opts.filters;
  const useILike = opts.search?.dialect === "postgres";

  if (f?.equals) {
    for (const [k, v] of Object.entries(f.equals)) {
      if (v === undefined) continue;
      if (Array.isArray(v)) where[k] = { [Op.in]: v };
      else where[k] = v as any;
    }
  }

  if (f?.contains) {
    for (const [k, v] of Object.entries(f.contains)) {
      if (v == null) continue;
      const values = Array.isArray(v) ? v : [v];
      const likeOp = useILike ? Op.iLike : Op.like;
      const pieces = values
        .filter(Boolean)
        .map((s) => ({ [k]: { [likeOp]: `%${s}%` } }));
      if (pieces.length) {
        (where as any)[Op.and] = [...(((where as any)[Op.and] as any[]) ?? []), { [Op.or]: pieces }];
      }
    }
  }

  if (f?.range) {
    for (const [k, cfg] of Object.entries(f.range)) {
      const clause: any = {};
      if ("between" in cfg && cfg.between) clause[Op.between] = cfg.between;
      if ("gte" in cfg && cfg.gte !== undefined) clause[Op.gte] = cfg.gte;
      if ("lte" in cfg && cfg.lte !== undefined) clause[Op.lte] = cfg.lte;
      if ("gt" in cfg && cfg.gt !== undefined) clause[Op.gt] = cfg.gt;
      if ("lt" in cfg && cfg.lt !== undefined) clause[Op.lt] = cfg.lt;
      if (Object.keys(clause).length) (where as any)[k] = { ...(where as any)[k], ...clause };
    }
  }

  if (f?.raw) {
    // Merge carefully to not overwrite
    ((where as any)[Op.and] as any[]) ??= [];
    ((where as any)[Op.and] as any[]).push(f.raw);
  }

  // ----- search (multi-column) -----
  const s = opts.search;
  if (s?.q && s?.columns?.length) {
    const likeOp = useILike ? Op.iLike : Op.like;
    const ors = s.columns.map((c) => ({
      [c]: { [likeOp]: `%${s.q}%` },
    }));
    ((where as any)[Op.and] as any[]) ??= [];
    (where as any)[Op.and].push({ [Op.or]: ors });
  }

  // ----- sorting -----
  const defaultOrder: OrderItem[] = opts.defaultOrder ?? [["created_at", "DESC"]];
  let order: OrderItem[] = defaultOrder;

  const sort = opts.sort;
  if (sort?.sortBy) {
    const safe = !sort.allowlist || sort.allowlist.includes(sort.sortBy);
    if (safe) {
      order = [[sort.sortBy, (sort.sortDir ?? "asc").toUpperCase() as "ASC" | "DESC"]];
    }
  }

  // ----- pagination -----
  const p = opts.pagination ?? {};
  if (p.mode === "cursor") {
    const field = p.cursorField ?? (Array.isArray(order[0]) ? (order[0][0] as string) : "id");
    const dir = (p.direction ?? "next") === "next" ? 1 : -1;
    const isDesc =
      Array.isArray(order[0]) && typeof order[0][1] === "string"
        ? order[0][1].toUpperCase() === "DESC"
        : false;
    const cmp = dir === 1
      ? (isDesc ? Op.lt : Op.gt)  // next page
      : (isDesc ? Op.gt : Op.lt); // prev page

    let cursorClause: WhereOptions | undefined;
    if (p.cursor !== undefined && p.cursor !== null && p.cursor !== "") {
      cursorClause = { [field]: { [cmp]: p.cursor as any } };
      ((where as any)[Op.and] as any[]) ??= [];
      ((where as any)[Op.and] as any[]).push(cursorClause);
    }

    const limit = Math.min(Math.max((p as any).pageSize ?? 20, 1), 200);

    return {
      where,
      order,
      limit,
      offset: undefined,
      cursorClause,
      cursorOrder: order,
    };
  }

  // default: offset pagination
  const page = Math.max(Number(p.page ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(p.pageSize ?? 20), 1), 200);
  const offset = (page - 1) * pageSize;

  return { where, order, limit: pageSize, offset };
}
