import type { APIResponse } from '@playwright/test';

import type { BaseTest } from './test';

export const setSettingValueById = async (api: BaseTest['api'], settingId: string, value: unknown, strict = true): Promise<APIResponse> => {
	const response = await api.post(`/settings/${settingId}`, { value });

	if (strict && !response.ok()) {
		throw new Error(
			`Failed to update setting "${settingId}" with value "${value}" [http status: ${response.status()} ${response.statusText()}]`,
		);
	}

	return response;
};
