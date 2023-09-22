import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useSingleStream, useUserId } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { i18n } from '../../app/utils/lib/i18n';
import { Utilities } from '../../ee/lib/misc/Utilities';

export const useAppTranslations = () => {
	const queryClient = useQueryClient();

	const apps = useSingleStream('apps');
	const uid = useUserId();

	const getAppsLanguages = useEndpoint('GET', '/apps/languages');

	const result = useQuery(['apps', 'translations'], () => getAppsLanguages(), {
		staleTime: Infinity,
	});

	useEffect(() => {
		if (result.data) {
			result.data.apps.forEach(({ id, languages }) => {
				loadAppI18nResources(id, languages);
			});
		}
	}, [result.data]);

	const invalidate = useDebouncedCallback(
		() => {
			queryClient.invalidateQueries(['apps', 'translations']);
		},
		100,
		[],
	);

	useEffect(() => {
		if (!uid) {
			return;
		}

		return apps('apps', ([key]) => {
			if (['app/added'].includes(key)) {
				invalidate();
			}
		});
	}, [uid, apps, invalidate]);

	const loadAppI18nResources = (
		appId: string,
		languages: {
			[key: string]: {
				Params: string;
				Description: string;
				Setting_Name: string;
				Setting_Description: string;
			};
		},
	) => {
		Object.entries(languages).forEach(([language, translations]) => {
			const regex = /([a-z]{2,3})-([a-z]{2,4})/;
			const match = regex.exec(language);
			const normalizedLanguage = match ? `${match[1]}-${match[2].toUpperCase()}` : language;

			// Translations keys must be scoped under app id
			const scopedTranslations = Object.entries(translations).reduce<Record<string, string>>((acc, [key, value]) => {
				acc[Utilities.getI18nKeyForApp(key, appId)] = value;
				return acc;
			}, {});

			i18n.addResourceBundle(normalizedLanguage, 'core', scopedTranslations);
		});
	};
};
