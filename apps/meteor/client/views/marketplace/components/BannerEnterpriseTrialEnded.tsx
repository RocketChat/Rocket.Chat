import { Banner, Icon } from '@rocket.chat/fuselage';
import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { usePermission, useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

const BannerEnterpriseTrialEnded = (): ReactElement => {
	const { t } = useTranslation();
	const isAdmin = usePermission('manage-apps');

	const bannerLink = {
		link: '/links/manage-subscription',
		linkText: t('Upgrade_tab_upgrade_your_plan'),
		linkTarget: '_blank',
	};

	const cloudWorkspaceHadTrial = useSetting('Cloud_Workspace_Had_Trial', false);

	const [showTrialBanner, setShowTrialBanner] = useLocalStorage('showAppsTrialEndBanner', cloudWorkspaceHadTrial);

	return (
		<>
			{showTrialBanner && (
				<Banner
					closeable
					icon={<Icon name='store' size='x24' />}
					variant='warning'
					title={t('Apps_disabled_when_Premium_trial_ended')}
					onClose={() => setShowTrialBanner(false)}
					{...(isAdmin && bannerLink)}
				>
					{isAdmin
						? t('Apps_disabled_when_Premium_trial_ended_description_admin')
						: t('Apps_disabled_when_Premium_trial_ended_description')}
				</Banner>
			)}
		</>
	);
};

export default BannerEnterpriseTrialEnded;
