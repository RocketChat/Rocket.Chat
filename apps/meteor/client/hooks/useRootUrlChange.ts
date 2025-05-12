import { useRole, useSetting, useSettingSetValue, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { Roles } from '../../app/models/client';
import UrlChangeModal from '../components/UrlChangeModal';
import { imperativeModal } from '../lib/imperativeModal';
import { isSyncReady } from '../lib/userData';

export const useRootUrlChange = (userId: string) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const isAdmin = useRole('admin');
	const firstRun = useRef<boolean>(true);

	const currentUrl = location.origin + window.__meteor_runtime_config__.ROOT_URL_PATH_PREFIX;
	const siteUrl = useSetting('Site_Url', '');
	const documentDomain = useSetting('Document_Domain', '');
	const setSiteUrl = useSettingSetValue('Site_Url');

	const siteUrlMutation = useMutation({
		mutationKey: ['settings', 'Site_Url'],
		mutationFn: async (url: string) => {
			await setSiteUrl(url);
			return { url };
		},
		onSuccess: ({ url }) => dispatchToastMessage({ type: 'success', message: `${t('Saved')}, new site url is: ${url}` }),
	});

	useEffect(() => {
		if (!Roles.ready.get() || !isSyncReady.get()) {
			return;
		}
		if (!firstRun.current) {
			return;
		}
		firstRun.current = false;

		if (!isAdmin) {
			return;
		}

		if (!siteUrl) {
			return;
		}

		if (window.__meteor_runtime_config__.ROOT_URL.replace(/\/$/, '') !== currentUrl) {
			const confirm = (): void => {
				imperativeModal.close();
				siteUrlMutation.mutate(currentUrl);
			};
			imperativeModal.open({
				component: UrlChangeModal,
				props: {
					onConfirm: confirm,
					siteUrl,
					currentUrl,
					onClose: imperativeModal.close,
				},
			});
		}

		if (documentDomain) {
			window.document.domain = documentDomain;
		}

		return () => {
			if (window.__meteor_runtime_config__.ROOT_URL.replace(/\/$/, '') !== currentUrl) {
				imperativeModal.close();
			}
		};
	}, [currentUrl, documentDomain, siteUrlMutation, siteUrl, userId, isAdmin]);
};
