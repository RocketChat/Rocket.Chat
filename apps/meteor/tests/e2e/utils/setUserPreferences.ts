import type { APIResponse } from '@playwright/test';
import { UsersSetPreferencesParamsPOST } from '@rocket.chat/rest-typings';

import type { BaseTest } from './test';

export const setUserPreferences = (api: BaseTest['api'], preferences: UsersSetPreferencesParamsPOST['data']): Promise<APIResponse> =>
	api.post(`/users.setPreferences`, { data: preferences });
