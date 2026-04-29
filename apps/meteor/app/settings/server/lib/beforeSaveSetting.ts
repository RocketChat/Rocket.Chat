import type { SettingValue } from '@rocket.chat/core-typings';
import { makeFunction } from '@rocket.chat/patch-injection';

export const beforeSaveSetting = makeFunction(async (_settingId: string, _newValue: SettingValue): Promise<void> => {
	// default no-op
});
