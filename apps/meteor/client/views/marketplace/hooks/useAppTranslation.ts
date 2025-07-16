import { useTranslation } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import { Utilities } from '../../../../ee/lib/misc/Utilities';

type AppTranslationFunction = {
	(key: string, ...replaces: unknown[]): string;
	has: (key: string | undefined) => boolean;
};

export const useAppTranslation = (appId: string): AppTranslationFunction => {
	const t = useTranslation();

	const tApp = useCallback(
		(key: string, ...args: unknown[]) => {
			if (!key) {
				return '';
			}
			const appKey = Utilities.getI18nKeyForApp(key, appId);

			if (t.has(appKey)) {
				return t(appKey, ...args);
			}
			if (t.has(key)) {
				return t(key, ...args);
			}
			return key;
		},
		[t, appId],
	);

	return Object.assign(tApp, {
		has: useCallback(
			(key: string | undefined) => {
				if (!key) {
					return false;
				}

				return t.has(Utilities.getI18nKeyForApp(key, appId)) || t.has(key);
			},
			[t, appId],
		),
	});
};
