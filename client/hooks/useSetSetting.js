import { useCallback } from 'react';

import { settings } from '../../app/settings/lib/settings';

export const useSetSetting = (settingName) => useCallback((value) => new Promise((resolve, reject) => {
	settings.set(settingName, value, (error, result) => {
		if (error) {
			reject(error);
			return;
		}

		resolve(result);
	});
}), [settingName]);
