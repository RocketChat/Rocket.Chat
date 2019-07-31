import { useCallback } from 'react';

import { settings } from '../../app/settings/lib/settings';

export const useBatchSetSettings = () =>
	useCallback((values) => new Promise((resolve, reject) => settings.batchSet(values, (error) => {
		if (error) {
			reject(error);
			return;
		}

		resolve();
	})), []);
