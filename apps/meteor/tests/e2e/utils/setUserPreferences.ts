import type { APIResponse } from '@playwright/test';
import type { UsersSetPreferencesParamsPOST } from '@rocket.chat/rest-typings';

import type { BaseTest } from './test';

export const setUserPreferences = async (
	api: BaseTest['api'],
	preferences: UsersSetPreferencesParamsPOST['data'],
): Promise<APIResponse> => {
	const response = await api.post(`/users.setPreferences`, { data: preferences });

	if (!response.ok()) {
		throw new Error(`Failed to update user preferences [http status: ${response.status()} ${response.statusText()}]`);
	}

	return response;
};
