import type { SettingId, ISetting } from '@rocket.chat/core-typings';
import { useContext, useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { SettingsContext } from '../SettingsContext';

export const useSettingStructure = (_id: SettingId): ISetting | undefined => {
	const { querySetting } = useContext(SettingsContext);
	const [subscribe, getSnapshot] = useMemo(() => querySetting(_id), [querySetting, _id]);
	return useSyncExternalStore(subscribe, getSnapshot);
};
