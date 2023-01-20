import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import UpsellModal from '../../components/UpsellModal';

const UnlimitedAppsUpsellModal = () => {
	const t = useTranslation();
	const trial = true;

	return (
		<UpsellModal
			title={t('Enable_unlimited_apps')}
			img='images/unlimited-apps-modal.svg'
			subtitle={t('Get_all_apps')}
			description={trial ? t('Workspaces_on_community_edition_trial_on') : t('Workspaces_on_community_edition_trial_off')}
			confirmText={trial ? t('Start_free_trial') : t('Learn_more')}
			cancelText={t('Talk_to_sales')}
			onConfirm={() => {
				return null;
			}}
			onCancel={() => {
				return null;
			}}
			onClose={() => {
				return null;
			}}
		/>
	);
};

export default UnlimitedAppsUpsellModal;
