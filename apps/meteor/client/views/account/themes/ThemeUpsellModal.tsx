import { useRole, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import UpsellModal from '../../../components/UpsellModal';

const ThemeUpsellModal = ({ onClose }: { onClose: () => void }) => {
	const t = useTranslation();

	const isAdmin = useRole('admin');

	if (!isAdmin) {
		return (
			<UpsellModal
				title={t('High_contrast_upsell_title')}
				img='images/high-contrast-upsell-modal.svg'
				subtitle={t('High_contrast_upsell_subtitle')}
				description={t('High_contrast_upsell_description')}
				cancelText={t('Close')}
				onConfirm={() => console.log('confirm')}
				onCancel={() => console.log('cancel')}
				annotation={t('High_contrast_upsell_annotation')}
				onClose={onClose}
			/>
		);
	}
	return (
		<UpsellModal
			title={t('High_contrast_upsell_title')}
			img='images/high-contrast-upsell-modal.svg'
			subtitle={t('High_contrast_upsell_subtitle')}
			description={t('High_contrast_upsell_description')}
			confirmText={t('Start_free_trial')}
			cancelText={t('Talk_to_sales')}
			onConfirm={() => console.log('TO DO')}
			onCancel={() => console.log('TO DO')}
			onClose={onClose}
		/>
	);
};
export default ThemeUpsellModal;
