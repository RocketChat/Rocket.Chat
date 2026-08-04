import type { SettingValue } from '@rocket.chat/core-typings';

export interface ISettingsService {
	get<T extends SettingValue>(settingId: string): Promise<T>;
	set<T extends SettingValue>(settingId: string, value: T): Promise<void>;
}
