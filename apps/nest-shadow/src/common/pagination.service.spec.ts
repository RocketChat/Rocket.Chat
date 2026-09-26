import { PaginationService } from './pagination.service.js';
import type { SettingsService } from '../settings/settings.service.js';

const withSettings = (values: Record<string, unknown>) =>
  new PaginationService({
    get: async (id: string) => values[id],
  } as unknown as SettingsService);

describe('PaginationService', () => {
  const limits = {
    API_Upper_Count_Limit: 100,
    API_Default_Count: 50,
    API_Allow_Infinite_Count: false,
  };

  it('uses the default count when the query has none', async () => {
    await expect(withSettings(limits).parse({})).resolves.toEqual({
      count: 50,
      offset: 0,
    });
  });

  it('caps the count at the upper limit', async () => {
    await expect(
      withSettings(limits).parse({ count: 500, offset: 10 }),
    ).resolves.toEqual({ count: 100, offset: 10 });
  });

  it('allows a count of 0 only with infinite counts', async () => {
    await expect(withSettings(limits).parse({ count: 0 })).resolves.toEqual({
      count: 50,
      offset: 0,
    });
    await expect(
      withSettings({ ...limits, API_Allow_Infinite_Count: true }).parse({
        count: 0,
      }),
    ).resolves.toEqual({ count: 0, offset: 0 });
  });
});
