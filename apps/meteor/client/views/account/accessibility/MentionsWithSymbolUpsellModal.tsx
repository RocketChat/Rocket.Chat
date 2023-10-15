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
				title={t('Empower_access_move_beyond_color')}
				img='images/mentions-upsell-modal.png'
				subtitle={t('Compliant_use_of_color')}
				description={t('Mentions_with_symbol_upsell_description')}
				onClose={onClose}
				onCancel={onClose}
				cancelText={t('Close')}
			/>
		);
	}
	return (
		<GenericUpsellModal
			title={t('Empower_access_move_beyond_color')}
			img='images/mentions-upsell-modal.png'
			subtitle={t('Compliant_use_of_color')}
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
