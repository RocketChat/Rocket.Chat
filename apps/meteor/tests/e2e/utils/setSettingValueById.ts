import type { APIResponse } from '@playwright/test';

import type { BaseTest } from './test';

export const setSettingValueById = (api: BaseTest['api'], settingId: string, value: unknown): Promise<APIResponse> =>
	api.post(`/settings/${settingId}`, { value });
