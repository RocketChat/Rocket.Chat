import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import GenericUpsellModal from '../../components/GenericUpsellModal';
import { useUpsellActions } from '../../components/GenericUpsellModal/hooks';

const UnlimitedAppsUpsellModal = ({ onClose }: { onClose: () => void }) => {
	const t = useTranslation();
	const { handleGoFullyFeatured, handleTalkToSales, cloudWorkspaceHadTrial } = useUpsellActions();

	return (
		<GenericUpsellModal
			title={t('Enable_unlimited_apps')}
			img='images/unlimited-apps-modal.png'
			subtitle={t('Get_all_apps')}
			description={!cloudWorkspaceHadTrial ? t('Workspaces_on_community_edition_trial_on') : t('Workspaces_on_community_edition_trial_off')}
			confirmText={!cloudWorkspaceHadTrial ? t('Start_free_trial') : t('Learn_more')}
			cancelText={t('Talk_to_sales')}
			onConfirm={handleGoFullyFeatured}
			onCancel={handleTalkToSales}
			onClose={onClose}
		/>
	);
};
export default UnlimitedAppsUpsellModal;
