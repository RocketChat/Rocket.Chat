import { useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import GenericUpsellModal from '../../components/GenericUpsellModal';

const UnlimitedAppsUpsellModal = () => {
	const t = useTranslation();
	const cloudWorkspaceHadTrial = useSetting('Cloud_Workspace_Had_Trial') as boolean;

	return (
		<GenericUpsellModal
			title={t('Enable_unlimited_apps')}
			img='images/unlimited-apps-modal.svg'
			subtitle={t('Get_all_apps')}
			description={!cloudWorkspaceHadTrial ? t('Workspaces_on_community_edition_trial_on') : t('Workspaces_on_community_edition_trial_off')}
			cancelText={t('Talk_to_sales')}
		/>
	);
};

export default UnlimitedAppsUpsellModal;
