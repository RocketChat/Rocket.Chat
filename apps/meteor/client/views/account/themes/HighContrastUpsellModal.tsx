import { useRole, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import GenericUpsellModal from '../../../components/GenericUpsellModal';

const HighContrastUpsellModal = ({ onClose }: { onClose: () => void }) => {
	const t = useTranslation();

	const isAdmin = useRole('admin');

	if (!isAdmin) {
		return (
			<GenericUpsellModal
				title={t('High_contrast_upsell_title')}
				img='images/high-contrast-upsell-modal.svg'
				subtitle={t('High_contrast_upsell_subtitle')}
				description={t('High_contrast_upsell_description')}
				cancelText={t('Close')}
				onCancel={onClose}
				annotation={t('High_contrast_upsell_annotation')}
			/>
		);
	}
	return (
		<GenericUpsellModal
			title={t('High_contrast_upsell_title')}
			img='images/high-contrast-upsell-modal.svg'
			subtitle={t('High_contrast_upsell_subtitle')}
			description={t('High_contrast_upsell_description')}
			cancelText={t('Talk_to_sales')}
			confirmText={t('Start_free_trial')}
		/>
	);
};
export default HighContrastUpsellModal;
