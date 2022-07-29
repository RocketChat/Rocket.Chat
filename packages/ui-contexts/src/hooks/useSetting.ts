import type { SettingId } from '@rocket.chat/core-typings';

import { useSettingStructure } from './useSettingStructure';

export const useSetting = (_id: SettingId): unknown | undefined => useSettingStructure(_id)?.value;
