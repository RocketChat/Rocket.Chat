import { useTranslation } from '@rocket.chat/ui-contexts';
import { FlowRouter } from 'meteor/kadira:flow-router';
import React from 'react';

import UpsellModal from '../../components/UpsellModal';

const UnlimitedAppsUpsellModal = () => {
	const t = useTranslation();
	const canTrial = true;
	const urls = {
		goFullyFeaturedRegistered: 'admin/upgrade/go-fully-featured-registered',
		talkToSales: 'go.rocket.chat/i/contact-sales',
	};

	return (
		<UpsellModal
			title={t('Enable_unlimited_apps')}
			img='images/unlimited-apps-modal.svg'
			subtitle={t('Get_all_apps')}
			description={canTrial ? t('Workspaces_on_community_edition_trial_on') : t('Workspaces_on_community_edition_trial_off')}
			confirmText={canTrial ? t('Start_free_trial') : t('Learn_more')}
			cancelText={t('Talk_to_sales')}
			onConfirm={() => {
				FlowRouter.go(urls.goFullyFeaturedRegistered);
			}}
			onCancel={() => {
				window.open(urls.talkToSales, '_blank');
			}}
			onClose={() => {
				return null;
			}}
		/>
	);
};

export default UnlimitedAppsUpsellModal;
