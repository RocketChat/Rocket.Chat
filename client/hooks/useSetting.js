import { useCallback } from 'react';

import { settings } from '../../app/settings/client';
import { useReactiveValue } from './useReactiveValue';

export const useSetting = (settingName) => [
	useReactiveValue(() => settings.get(settingName), [settingName]),
	useCallback((value) => new Promise((resolve, reject) => {
		settings.set(settingName, value, (error, result) => {
			if (error) {
				reject(error);
				return;
			}

			resolve(result);
		});
	}), [settingName]),
];
