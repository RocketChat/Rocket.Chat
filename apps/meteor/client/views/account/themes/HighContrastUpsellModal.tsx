import { useRole, useTranslation, useRoute } from '@rocket.chat/ui-contexts';
import React, { useCallback } from 'react';

import UpsellModal from '../../../components/UpsellModal';

const HighContrastUpsellModal = ({ onClose }: { onClose: () => void }) => {
	const t = useTranslation();

	const isAdmin = useRole('admin');

	const talkToSales = 'https://go.rocket.chat/i/contact-sales';
	const upgradeRoute = useRoute('upgrade');

	const goFullyFeaturedRegistered = useCallback(() => {
		upgradeRoute.push({ type: 'go-fully-featured-registered' });
		onClose();
	}, [upgradeRoute, onClose]);

	const goToTalkSales = useCallback(() => {
		window.open(talkToSales, '_blank');
		onClose();
	}, [onClose, talkToSales]);

	if (!isAdmin) {
		return (
			<UpsellModal
				title={t('High_contrast_upsell_title')}
				img='images/high-contrast-upsell-modal.svg'
				subtitle={t('High_contrast_upsell_subtitle')}
				description={t('High_contrast_upsell_description')}
				onClose={onClose}
				cancelText={t('Close')}
				onCancel={onClose}
				annotation={t('High_contrast_upsell_annotation')}
			/>
		);
	}
	return (
		<UpsellModal
			title={t('High_contrast_upsell_title')}
			img='images/high-contrast-upsell-modal.svg'
			subtitle={t('High_contrast_upsell_subtitle')}
			description={t('High_contrast_upsell_description')}
			onClose={onClose}
			cancelText={t('Talk_to_sales')}
			onCancel={goToTalkSales}
			confirmText={t('Start_free_trial')}
			onConfirm={goFullyFeaturedRegistered}
		/>
	);
};
export default HighContrastUpsellModal;
