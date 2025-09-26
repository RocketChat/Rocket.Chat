import { getSettingValueById } from './getSettingValueById';
import { test } from './test';

export function preserveSettings(settingsList: string[]) {
	const originalSettings: Record<string, unknown> = {};

	test.beforeAll(async ({ api }) => {
		const settingValues = await Promise.all(settingsList.map((setting) => getSettingValueById(api, setting)));
		settingsList.forEach((setting, index) => {
			originalSettings[setting] = settingValues[index];
		});
	});

	test.afterAll(async ({ api }) => {
		await Promise.all(settingsList.map((setting) => api.post(`/settings/${setting}`, { value: originalSettings[setting] })));
	});

	return originalSettings;
}
