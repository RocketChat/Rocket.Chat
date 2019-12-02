import { useCallback } from 'react';

import { settings } from '../../app/settings/lib/settings';

export const useBatchSetSettings = () => useCallback((entries) => new Promise((resolve, reject) => {
	settings.batchSet(entries, (error, result) => {
		if (error) {
			reject(error);
			return;
		}

		resolve(result);
	});
}), []);
