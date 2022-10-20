import type { BaseTest } from './test';

export const getSettingById = (api: BaseTest['api'], settingId: string): Promise<unknown> => {
	return api.get(`/settings/${settingId}`);
};
