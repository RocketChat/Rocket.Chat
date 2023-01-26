import { Banner, Icon } from '@rocket.chat/fuselage';
import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { usePermission, useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

const BannerEnterpriseTrialEnded = (): ReactElement => {
	const t = useTranslation();
	const isAdmin = usePermission('enable-unlimited-apps');
	const bannerLink = {
		// TODO: add link internal to upgrade page
		link: '#',
		linkText: t('Upgrade_tab_upgrade_your_plan'),
	};
	const cloudWorkspaceHadTrial = useSetting('Cloud_Workspace_Had_Trial') as boolean;

	const [showTrialBanner, setShowTrialBanner] = useLocalStorage('showAppsTrialEndBanner', cloudWorkspaceHadTrial);

	return (
		<>
			{showTrialBanner && (
				<Banner
					closeable
					icon={<Icon name='store' size={24} />}
					variant='warning'
					title={t('Apps_disabled_when_Enterprise_trial_ended')}
					onClose={() => setShowTrialBanner(false)}
					{...(isAdmin && bannerLink)}
				>
					{isAdmin
						? t('Apps_disabled_when_Enterprise_trial_ended_description_admin')
						: t('Apps_disabled_when_Enterprise_trial_ended_description')}
					{}
				</Banner>
			)}
		</>
	);
};

export default BannerEnterpriseTrialEnded;
