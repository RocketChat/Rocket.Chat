import type { APIResponse } from '@playwright/test';

import type { ApiTest } from './test';

export const ignoreModal = (api: ApiTest, bannerId = 'device-management'): Promise<APIResponse> =>
	api.post('/v1/banners.dismiss', { bannerId });
