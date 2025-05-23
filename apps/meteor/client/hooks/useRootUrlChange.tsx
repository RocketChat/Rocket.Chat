import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useRole, useSetModal, useSetting, useSettingSetValue, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import UrlChangeModal from '../components/UrlChangeModal';

export const useRootUrlChange = () => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const isAdmin = useRole('admin');
	const setModal = useSetModal();
	const closeModal = useEffectEvent(() => setModal(null));

	const currentUrl = location.origin + window.__meteor_runtime_config__.ROOT_URL_PATH_PREFIX;
	const siteUrl = useSetting('Site_Url', '');
	const documentDomain = useSetting('Document_Domain', '');
	const setSiteUrl = useSettingSetValue('Site_Url');

	const {
		mutate: siteUrlMutation,
		isPending,
		isSuccess,
	} = useMutation({
		mutationKey: ['settings', 'Site_Url'],
		mutationFn: async (url: string) => {
			await setSiteUrl(url);
			return { url };
		},
		onSuccess: ({ url }) => dispatchToastMessage({ type: 'success', message: t('Saved_new_url_site_is__url__', { url }) }),
		onError: () => dispatchToastMessage({ type: 'error', message: t('Something_went_wrong') }),
	});

	useEffect(() => {
		if (!isAdmin) {
			return;
		}
		if (!siteUrl) {
			return;
		}
		if (isPending || isSuccess) {
			return;
		}
		if (window.__meteor_runtime_config__.ROOT_URL.replace(/\/$/, '') === currentUrl) {
			return;
		}
		const onConfirm = () => {
			closeModal();
			siteUrlMutation(currentUrl);
		};

		setModal(<UrlChangeModal onClose={closeModal} onConfirm={onConfirm} siteUrl={siteUrl} currentUrl={currentUrl} />);

		if (documentDomain) {
			window.document.domain = documentDomain;
		}

		return closeModal;
	}, [currentUrl, documentDomain, siteUrlMutation, siteUrl, isAdmin, isPending, isSuccess, setModal, closeModal]);
};
