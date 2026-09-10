import type { APIResponse } from '@playwright/test';
import type { UsersSetPreferencesParamsPOST } from '@rocket.chat/rest-typings';

import type { BaseTest } from './test';

export const setUserPreferences = (
	api: BaseTest['api'],
	preferences: UsersSetPreferencesParamsPOST['data'],
	userId?: string,
): Promise<APIResponse> => api.post(`/users.setPreferences`, { ...(userId ? { userId } : undefined), data: preferences });
