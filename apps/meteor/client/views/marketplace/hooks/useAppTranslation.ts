import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { Utilities } from '../../../../ee/lib/misc/Utilities';

type AppTranslationFunction = {
	(key: string): string;
	has: (key: string | undefined) => boolean;
};

export const useAppTranslation = (appId: string): AppTranslationFunction => {
	const { t, i18n } = useTranslation();

	const tApp = useCallback(
		(key: string) => {
			if (!key) {
				return '';
			}
			const appKey = Utilities.getI18nKeyForApp(key, appId);

			if (i18n.exists(appKey)) {
				return t(appKey);
			}
			if (i18n.exists(key)) {
				return t(key);
			}
			return key;
		},
		[t, i18n, appId],
	);

	return Object.assign(tApp, {
		has: useCallback(
			(key: string | undefined) => {
				if (!key) {
					return false;
				}

				return i18n.exists(Utilities.getI18nKeyForApp(key, appId)) || i18n.exists(key);
			},
			[i18n, appId],
		),
	});
};
