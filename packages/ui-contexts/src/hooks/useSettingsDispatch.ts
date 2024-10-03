import type { ISetting } from '@rocket.chat/core-typings';
import { useContext } from 'react';

import { SettingsContext } from '../SettingsContext';

export const useSettingsDispatch = (): ((
	changes: {
		_id: ISetting['_id'];
		value: ISetting['value'];
	}[],
) => Promise<void>) => useContext(SettingsContext).dispatch;
