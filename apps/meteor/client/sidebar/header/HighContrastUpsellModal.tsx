import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import UpsellModal from '../../components/UpsellModal';

const HighContrastUpsellModal = ({ onClose }: { onClose: () => void }) => {
	const t = useTranslation();

	return (
		<UpsellModal
			title={t('Theme_high_contrast')}
			img='images/unlimited-apps-modal.svg'
			subtitle='High contrast upsell modal in progress'
			description='(description) High contrast upsell modal in progress'
			confirmText={t('Start_free_trial')}
			cancelText={t('Talk_to_sales')}
			onConfirm={() => console.log('TO DO')}
			onCancel={() => console.log('TO DO')}
			onClose={onClose}
		/>
	);
};
export default HighContrastUpsellModal;
