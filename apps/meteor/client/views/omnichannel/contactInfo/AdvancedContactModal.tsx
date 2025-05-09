import { useRole, useEndpoint } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { getURL } from '../../../../app/utils/client/getURL';
import GenericUpsellModal from '../../../components/GenericUpsellModal';
import { useUpsellActions } from '../../../components/GenericUpsellModal/hooks';
import { useExternalLink } from '../../../hooks/useExternalLink';
import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';

type AdvancedContactModalProps = {
	onCancel: () => void;
};

const AdvancedContactModal = ({ onCancel }: AdvancedContactModalProps) => {
	const { t } = useTranslation();
	const isAdmin = useRole('admin');
	const hasLicense = useHasLicenseModule('contact-id-verification') as boolean;
	const { shouldShowUpsell, handleManageSubscription } = useUpsellActions(hasLicense);
	const openExternalLink = useExternalLink();
	const eventStats = useEndpoint('POST', '/v1/statistics.telemetry');

	const handleUpsellClick = async () => {
		eventStats({
			params: [{ eventName: 'updateCounter', settingsId: 'Advanced_Contact_Upsell_Clicks_Count' }],
		});
		return handleManageSubscription();
	};

	useEffect(() => {
		if (shouldShowUpsell) {
			eventStats({
				params: [{ eventName: 'updateCounter', settingsId: 'Advanced_Contact_Upsell_Views_Count' }],
			});
		}
	}, [eventStats, shouldShowUpsell]);

	return (
		<GenericUpsellModal
			title={t('Advanced_contact_profile')}
			description={t('Advanced_contact_profile_description')}
			img={getURL('images/single-contact-id-upsell.png')}
			onClose={onCancel}
			onCancel={shouldShowUpsell ? onCancel : () => openExternalLink('https://go.rocket.chat/i/omnichannel-docs')}
			cancelText={!shouldShowUpsell ? t('Learn_more') : undefined}
			onConfirm={shouldShowUpsell ? handleUpsellClick : undefined}
			annotation={!shouldShowUpsell && !isAdmin ? t('Ask_enable_advanced_contact_profile') : undefined}
		/>
	);
};

export default AdvancedContactModal;
