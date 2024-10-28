import { Banner, Icon } from '@rocket.chat/fuselage';
import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { usePermission, useSetting } from '@rocket.chat/ui-contexts';
import React from 'react';
import { useTranslation } from 'react-i18next';

const BannerEnterpriseTrialEnded = () => {
	const { t } = useTranslation();
	const canManageApps = usePermission('manage-apps');

	const cloudWorkspaceHadTrial = useSetting('Cloud_Workspace_Had_Trial', false);

	const [showTrialBanner, setShowTrialBanner] = useLocalStorage('showAppsTrialEndBanner', cloudWorkspaceHadTrial);

	if (!showTrialBanner) {
		return null;
	}

	if (!canManageApps) {
		return (
			<Banner
				closeable
				icon={<Icon name='store' size='x24' />}
				variant='warning'
				title={t('Apps_disabled_when_Premium_trial_ended')}
				onClose={() => setShowTrialBanner(false)}
			>
				{t('Apps_disabled_when_Premium_trial_ended_description')}
			</Banner>
		);
	}

	return (
		<Banner
			closeable
			icon={<Icon name='store' size='x24' />}
			variant='warning'
			title={t('Apps_disabled_when_Premium_trial_ended')}
			link='/links/manage-subscription'
			linkText={t('Upgrade_tab_upgrade_your_plan')}
			linkTarget='_blank'
			onClose={() => setShowTrialBanner(false)}
		>
			{t('Apps_disabled_when_Premium_trial_ended_description_admin')}
		</Banner>
	);
};

export default BannerEnterpriseTrialEnded;
