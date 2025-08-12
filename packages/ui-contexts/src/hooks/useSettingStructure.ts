import type { ISetting } from '@rocket.chat/core-typings';
import { useContext, useMemo, useSyncExternalStore } from 'react';

import { SettingsContext } from '../SettingsContext';

export const useSettingStructure = (_id: ISetting['_id']): ISetting | undefined => {
	const { querySetting } = useContext(SettingsContext);
	const [subscribe, getSnapshot] = useMemo(() => querySetting(_id), [querySetting, _id]);
	return useSyncExternalStore(subscribe, getSnapshot);
};
