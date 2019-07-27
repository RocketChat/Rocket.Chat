import { useCallback } from 'react';

import { settings } from '../../app/settings/client';
import { useReactiveValue } from './useReactiveValue';

export const useSetting = (settingName) => {
	const setter = useCallback((newValue) => {
		settings.set(settingName, newValue);
	}, [settingName]);

	const value = useReactiveValue(() => settings.get(settingName));

	return [value, setter];
};
