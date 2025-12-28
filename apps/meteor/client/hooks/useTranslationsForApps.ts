import { normalizeLanguage } from '@rocket.chat/tools';
import { useEndpoint, useStream, useUserId } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { withDebouncing } from '../../lib/utils/highOrderFunctions';

export const useTranslationsForApps = () => {
	const getAppsLanguages = useEndpoint('GET', '/apps/languages');

	const { isSuccess, data } = useQuery({
		queryKey: ['apps', 'translations'] as const,
		queryFn: () => getAppsLanguages(),
		staleTime: Infinity,
	});

	const { i18n } = useTranslation();

	useEffect(() => {
		if (!isSuccess) {
			return;
		}

		data.apps.forEach(({ id: appId, languages }) => {
			Object.entries(languages).forEach(([language, translations]) => {
				const normalizedLanguage = normalizeLanguage(language);
				const namespace = `app-${appId}`;
				i18n.addResourceBundle(normalizedLanguage, namespace, translations);
			});
		});
	}, [i18n, data, isSuccess]);

	const queryClient = useQueryClient();
	const subscribeToApps = useStream('apps');
	const uid = useUserId();

	useEffect(() => {
		if (!uid) {
			return;
		}

		const invalidate = withDebouncing({ wait: 100 })(() => {
			queryClient.invalidateQueries({
				queryKey: ['apps', 'translations'],
			});
		});

		const unsubscribe = subscribeToApps('apps', ([key]) => {
			if (key === 'app/added') {
				invalidate();
			}
		});

		return () => {
			unsubscribe();
			invalidate.cancel();
		};
	}, [uid, subscribeToApps, queryClient]);
};
