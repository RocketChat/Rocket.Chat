import { Banner, Icon } from '@rocket.chat/fuselage';
import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { usePermission, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

const BannerEnterpriseTrialEnded = (): ReactElement => {
	const t = useTranslation();
	const isAdmin = usePermission('');
	const bannerLink = {
		// TODO: add link internal to upgrade page
		link: '',
		linkText: t('Upgrade_tab_upgrade_your_plan'),
	};

	// TODO: verify trial end date
	const [showTrialBanner, setShowTrialBanner] = useLocalStorage('showAppsTrialEndBanner', true);

	return (
		<>
			{showTrialBanner && (
				<Banner
					closeable
					icon={<Icon name='store' size={24} />}
					variant='warning'
					title={t('Apps_disabled_when_Enterprise_trial_ended')}
					onClose={() => setShowTrialBanner(false)}
					{...(isAdmin && { bannerLink })}
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
