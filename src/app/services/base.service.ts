import { container } from 'tsyringe';
import type { Logger } from '../../lib/internal/logger';
import { TOKENS } from '../../lib/internal/di-tokens';

export type PaginationResponse<T> = {
  meta: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
  data: T[];
};

export abstract class BaseService {
  protected logger: Logger;

  constructor() {
    this.logger = container.resolve<Logger>(TOKENS.Logger);
  }
}
