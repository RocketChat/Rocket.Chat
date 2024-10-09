import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { getURL } from '../../../../app/utils/client/getURL';
import GenericUpsellModal from '../../../components/GenericUpsellModal';

const IdentityVerificationModal = ({ onCancel }) => {
	const t = useTranslation();

	// aria-label={t('Device_Management')}
	// 				title={t('Device_Management')}
	// 				img={getURL('images/device-management.png')}
	// 				subtitle={t('Ensure_secure_workspace_access')}
	// 				description={t('Manage_which_devices')}
	// 				onClose={() => setModal(null)}
	// 				onConfirm={handleManageSubscription}
	// 				onCancel={() => setModal(null)}

	return (
		<GenericUpsellModal
			title={t('Identity_verification')}
			description='Verify contact identification using methods like SMS, email OTP or install custom authentication mechanisms apps from marketplace.'
			img={getURL('images/device-management.png')}
			onClose={onCancel}
			onCancel={onCancel}
		/>
	);
};

export default IdentityVerificationModal;
