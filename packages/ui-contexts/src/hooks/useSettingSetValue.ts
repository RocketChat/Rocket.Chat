import type { ISetting, SettingId } from '@rocket.chat/core-typings';
import { useCallback } from 'react';

import { useSettingsDispatch } from './useSettingsDispatch';

export const useSettingSetValue = <T extends ISetting['value']>(_id: SettingId): ((value: T) => Promise<void>) => {
	const dispatch = useSettingsDispatch();
	return useCallback((value: T) => dispatch([{ _id, value }]), [dispatch, _id]);
};
