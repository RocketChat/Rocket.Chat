import { Injectable } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service.js';

export interface PaginationQuery {
  count?: number;
  offset?: number;
}

// Applies the workspace limits for page size: the API_Default_Count default,
// the API_Upper_Count_Limit cap, and a count of 0 only when infinite counts
// are allowed.
@Injectable()
export class PaginationService {
  constructor(private readonly settings: SettingsService) {}

  async parse(
    query: PaginationQuery,
  ): Promise<{ count: number; offset: number }> {
    const [upperLimit, defaultCount, allowInfinite] = await Promise.all([
      this.settings.get<number>('API_Upper_Count_Limit'),
      this.settings.get<number>('API_Default_Count'),
      this.settings.get<boolean>('API_Allow_Infinite_Count'),
    ]);

    const hardUpperLimit = upperLimit && upperLimit <= 0 ? 100 : upperLimit;
    const fallbackCount = defaultCount && defaultCount <= 0 ? 50 : defaultCount;

    let count = query.count ?? fallbackCount;
    if (count > hardUpperLimit) {
      count = hardUpperLimit;
    }
    if (count === 0 && !allowInfinite) {
      count = fallbackCount;
    }

    return { count, offset: query.offset ?? 0 };
  }
}
