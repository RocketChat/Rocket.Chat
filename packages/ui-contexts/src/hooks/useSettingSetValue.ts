import type { ISetting } from '@rocket.chat/core-typings';
import { useCallback } from 'react';

import { useSettingsDispatch } from './useSettingsDispatch';

export const useSettingSetValue = <T extends ISetting['value']>(_id: ISetting['_id']): ((value: T) => Promise<void>) => {
	const dispatch = useSettingsDispatch();
	return useCallback((value: T) => dispatch([{ _id, value }]), [dispatch, _id]);
};
