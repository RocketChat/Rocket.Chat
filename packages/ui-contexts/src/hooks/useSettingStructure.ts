import type { SettingId, ISetting } from '@rocket.chat/core-typings';
import { useContext, useMemo } from 'react';
import { useSubscription } from 'use-subscription';

import { SettingsContext } from '../SettingsContext';

export const useSettingStructure = (_id: SettingId): ISetting | undefined => {
	const { querySetting } = useContext(SettingsContext);
	const subscription = useMemo(() => querySetting(_id), [querySetting, _id]);
	return useSubscription(subscription);
};
