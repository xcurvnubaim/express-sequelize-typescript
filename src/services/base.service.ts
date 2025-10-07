import { container } from "tsyringe";
import type { Logger } from "../lib/app/logger";
import { TOKENS } from "../lib/app/di-tokens";

export type PaginationResponse<T> = {
    meta: {
        totalItems: number;
        totalPages: number;
        currentPage: number;
        pageSize: number;
    };
    data: T[];
}

export abstract class BaseService {
    // Common service methods can go here
    protected logger: Logger;
    constructor() {
        this.logger = container.resolve<Logger>(TOKENS.Logger);
    }
}
