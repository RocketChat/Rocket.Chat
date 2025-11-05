import { useSetModal, useSetting } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import { useExternalLink } from '../../../hooks/useExternalLink';
import { useIsEnterprise } from '../../../hooks/useIsEnterprise';
import { links } from '../../../lib/links';
import { useCheckoutUrl } from '../../../views/admin/subscription/hooks/useCheckoutUrl';

const TALK_TO_SALES_URL = links.go.contactSales;

export const useUpsellActions = (hasLicenseModule = false) => {
	const setModal = useSetModal();
	const handleOpenLink = useExternalLink();
	const cloudWorkspaceHadTrial = useSetting('Cloud_Workspace_Had_Trial', false);

	const { data } = useIsEnterprise();
	const shouldShowUpsell = !data?.isEnterprise || !hasLicenseModule;

	const openExternalLink = useExternalLink();
	const manageSubscriptionUrl = useCheckoutUrl()({ target: 'upsell-modal', action: 'upgrade' });

	const handleManageSubscription = useCallback(() => {
		openExternalLink(manageSubscriptionUrl);
		setModal(null);
	}, [manageSubscriptionUrl, openExternalLink, setModal]);

	const handleTalkToSales = useCallback(() => {
		handleOpenLink(TALK_TO_SALES_URL);
		setModal(null);
	}, [handleOpenLink, setModal]);

	return { shouldShowUpsell, cloudWorkspaceHadTrial, handleManageSubscription, handleTalkToSales };
};
