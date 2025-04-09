import type { APIResponse } from '@playwright/test';
import type { ISetting } from '@rocket.chat/core-typings';

import type { BaseTest } from './test';

export const updateSetting = async (api: BaseTest['api'], settingId: string, value: unknown, strict = true): Promise<APIResponse> => {
	const response = await api.post(`/settings/${settingId}`, { value });

	if (strict && !response.ok()) {
		throw new Error(
			`Failed to update setting "${settingId}" with value "${value}" [http status: ${response.status()} ${response.statusText()}]`,
		);
	}

	return response;
};

export const updateSettings = async (
	api: BaseTest['api'],
	settings: Record<ISetting['_id'], ISetting['value']>,
	strict = true,
): Promise<APIResponse[]> => {
	const entries = Object.entries(settings);
	return Promise.all(entries.map(([name, value]) => updateSetting(api, name, value, strict)));
};
