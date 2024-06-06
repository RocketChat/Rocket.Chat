import type { SettingValue } from '@rocket.chat/core-typings';
import { Settings } from '@rocket.chat/models';
import mem from 'mem';

export const getSettingCached = mem(async (setting: string): Promise<SettingValue> => Settings.getValueById(setting), { maxAge: 10000 });
