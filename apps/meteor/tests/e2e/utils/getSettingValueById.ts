import type { BaseTest } from './test';

export const getSettingValueById = async (api: BaseTest['api'], settingId: string): Promise<unknown> => {
	const response = await api.get(`/settings/${settingId}`);
	const { value } = await response.json();
	return value;
};
