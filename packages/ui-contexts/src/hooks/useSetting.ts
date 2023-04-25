import type { ISetting, SettingValue } from '@rocket.chat/core-typings';

import { useSettingStructure } from './useSettingStructure';

export function useSetting<TValue extends SettingValue>(settingId: ISetting['_id']): TValue | undefined;
export function useSetting<TValue extends SettingValue>(settingId: ISetting['_id'], fallbackValue: TValue): TValue;
export function useSetting<TValue extends SettingValue>(settingId: ISetting['_id'], fallbackValue?: TValue): TValue | undefined {
	const setting = useSettingStructure(settingId);
	return (setting?.value as TValue | undefined) ?? fallbackValue;
}
