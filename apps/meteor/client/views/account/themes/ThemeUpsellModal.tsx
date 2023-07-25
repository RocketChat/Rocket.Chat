import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import UpsellModal from '../../../components/UpsellModal';

const ThemeUpsellModal = ({ onClose }: { onClose: () => void }) => {
	const t = useTranslation();

	return (
		<UpsellModal
			title={t('Themes')}
			img='images/unlimited-apps-modal.svg'
			subtitle='Themes upsell modal in progress'
			description='(description) Themes upsell modal in progress'
			confirmText={t('Start_free_trial')}
			cancelText={t('Talk_to_sales')}
			onConfirm={() => console.log('TO DO')}
			onCancel={() => console.log('TO DO')}
			onClose={onClose}
		/>
	);
};
export default ThemeUpsellModal;
