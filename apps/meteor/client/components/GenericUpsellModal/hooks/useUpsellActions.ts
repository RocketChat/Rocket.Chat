import { useRouter, useSetModal, useSetting } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import { useExternalLink } from '../../../hooks/useExternalLink';
import { useIsEnterprise } from '../../../hooks/useIsEnterprise';

const TALK_TO_SALES_URL = 'https://go.rocket.chat/i/contact-sales';

export const useUpsellActions = (hasLicenseModule = false) => {
	const router = useRouter();
	const setModal = useSetModal();
	const handleOpenLink = useExternalLink();
	const cloudWorkspaceHadTrial = useSetting<boolean>('Cloud_Workspace_Had_Trial');

	const { data } = useIsEnterprise();
	const shouldShowUpsell = !data?.isEnterprise || !hasLicenseModule;

	const handleManageSubscription = useCallback(() => {
		router.navigate('/admin/subscription');
		setModal(null);
	}, [router, setModal]);

	const handleTalkToSales = useCallback(() => {
		handleOpenLink(TALK_TO_SALES_URL);
		setModal(null);
	}, [handleOpenLink, setModal]);

	return { shouldShowUpsell, cloudWorkspaceHadTrial, handleManageSubscription, handleTalkToSales };
};
