import { useRole, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import GenericUpsellModal from '../../../components/GenericUpsellModal';
import { useUpsellActions } from '../../../components/GenericUpsellModal/hooks';

const MentionsWithSymbolUpsellModal = ({ onClose }: { onClose: () => void }) => {
	const t = useTranslation();

	const isAdmin = useRole('admin');
	const { handleGoFullyFeatured, handleTalkToSales } = useUpsellActions();

	if (!isAdmin) {
		return (
			<GenericUpsellModal
				title={t('Mentions_with_symbol_upsell_title')}
				img='images/high-contrast-upsell-modal.png'
				subtitle={t('Mentions_with_symbol_upsell_subtitle')}
				description={t('Mentions_with_symbol_upsell_description')}
				onClose={onClose}
				onCancel={onClose}
				cancelText={t('Close')}
				annotation={t('Mentions_with_symbol_upsell_annotation')}
			/>
		);
	}
	return (
		<GenericUpsellModal
			title={t('Mentions_with_symbol_upsell_title')}
			img='images/high-contrast-upsell-modal.png'
			subtitle={t('Mentions_with_symbol_upsell_subtitle')}
			description={t('Mentions_with_symbol_upsell_description')}
			onClose={onClose}
			onCancel={handleTalkToSales}
			onConfirm={handleGoFullyFeatured}
			cancelText={t('Talk_to_an_expert')}
			confirmText={t('Start_free_trial')}
		/>
	);
};
export default MentionsWithSymbolUpsellModal;
