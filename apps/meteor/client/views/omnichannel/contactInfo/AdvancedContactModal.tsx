import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { getURL } from '../../../../app/utils/client/getURL';
import GenericUpsellModal from '../../../components/GenericUpsellModal';
import { useUpsellActions } from '../../../components/GenericUpsellModal/hooks';
// import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';

type AdvancedContactModalProps = {
	onCancel: () => void;
};

const AdvancedContactModal = ({ onCancel }: AdvancedContactModalProps) => {
	const t = useTranslation();

	const hasLicense = false;
	const { shouldShowUpsell, handleManageSubscription } = useUpsellActions(hasLicense);

	return (
		<GenericUpsellModal
			title={t('Advanced_contact_profile')}
			description={t('Advanced_contact_profile_description')}
			img={getURL('images/single-contact-id-upsell.png')}
			onClose={onCancel}
			onCancel={onCancel}
			onConfirm={handleManageSubscription}
		/>
	);
};

export default AdvancedContactModal;
