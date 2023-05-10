import type { SettingValue } from '@rocket.chat/core-typings';

export interface ISettingsService {
	get<T extends SettingValue>(settingId: string): Promise<T>;
}
