import { useRouter, useSetModal, useCurrentModal } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import { useExternalLink } from '../../../hooks/useExternalLink';
import { useIsEnterprise } from '../../../hooks/useIsEnterprise';

const TALK_TO_SALES_URL = 'https://go.rocket.chat/i/contact-sales';

export const useUpsellActions = (hasLicenseModule = false) => {
	const router = useRouter();
	const setModal = useSetModal();
	const handleOpenLink = useExternalLink();
	const isModalOpen = useCurrentModal() !== null;

	const { data } = useIsEnterprise();
	const shouldShowUpsell = !data?.isEnterprise || !hasLicenseModule;

	const handleGoFullyFeatured = useCallback(() => {
		setModal(null);
		router.navigate('/admin/upgrade/go-fully-featured-registered');
	}, [router, setModal]);

	const handleTalkToSales = useCallback(() => {
		setModal(null);
		handleOpenLink(TALK_TO_SALES_URL);
	}, [handleOpenLink, setModal]);

	return { isModalOpen, shouldShowUpsell, handleGoFullyFeatured, handleTalkToSales };
};
