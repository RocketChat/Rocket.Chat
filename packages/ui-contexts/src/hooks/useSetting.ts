import type { ISetting, SettingValue } from '@rocket.chat/core-typings';

import { useSettingStructure } from './useSettingStructure';

export function useSetting<TSetting extends ISetting>(settingId: TSetting['_id']): TSetting['value'] | undefined;
export function useSetting<TValue extends SettingValue>(settingId: ISetting['_id']): TValue | undefined;
export function useSetting(settingId: ISetting['_id'], fallbackValue: string): string;
export function useSetting(settingId: ISetting['_id'], fallbackValue: boolean): boolean;
export function useSetting(settingId: ISetting['_id'], fallbackValue: number): number;
export function useSetting<TValue extends SettingValue>(settingId: ISetting['_id'], fallbackValue: TValue): TValue;
export function useSetting<TValue extends SettingValue>(settingId: ISetting['_id'], fallbackValue?: TValue): TValue | undefined {
	const setting = useSettingStructure(settingId);
	return (setting?.value as TValue | undefined) ?? fallbackValue;
}
