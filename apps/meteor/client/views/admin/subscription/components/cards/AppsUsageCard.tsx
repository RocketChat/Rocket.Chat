import { Box, ProgressBar, Skeleton } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import type { CardProps } from '../FeatureUsageCard';
import FeatureUsageCard from '../FeatureUsageCard';
import UpgradeButton from '../UpgradeButton';

type AppsUsageCardProps = {
	privateAppsLimit?: { value?: number; max: number };
	marketplaceAppsLimit?: { value?: number; max: number };
};

const AppsUsageCard = ({ privateAppsLimit, marketplaceAppsLimit }: AppsUsageCardProps): ReactElement => {
	const { t } = useTranslation();

	const marketplaceAppsEnabled = marketplaceAppsLimit?.value || 0;
	const marketplaceAppsLimitCount = marketplaceAppsLimit?.max || 5;
	const marketplaceAppsPercentage = Math.round((marketplaceAppsEnabled / marketplaceAppsLimitCount) * 100);

	const privateAppsEnabled = privateAppsLimit?.value || 0;
	const privateAppsLimitCount = privateAppsLimit?.max || 3;
	const privateAppsPercentage = Math.round((privateAppsEnabled / privateAppsLimitCount) * 100);

	const card: CardProps = {
		title: t('Apps'),
		infoText: t('Apps_InfoText'),
		...((marketplaceAppsPercentage || 0) >= 80 && {
			upgradeButton: (
				<UpgradeButton target='app-usage-card' action='upgrade' small>
					{t('Upgrade')}
				</UpgradeButton>
			),
		}),
	};

	if (!privateAppsLimit || !marketplaceAppsLimit) {
		return (
			<FeatureUsageCard card={card}>
				<Skeleton variant='rect' width='x112' height='x112' />
			</FeatureUsageCard>
		);
	}

	return (
		<FeatureUsageCard card={card}>
			<Box fontScale='c1' mb={12}>
				<Box display='flex' flexGrow='1' justifyContent='space-between' mbe={4}>
					<div>{t('Marketplace_apps')}</div>
					<Box color={(marketplaceAppsPercentage || 0) >= 80 ? 'font-danger' : 'status-font-on-success'}>
						{marketplaceAppsEnabled} / {marketplaceAppsLimitCount}
					</Box>
				</Box>

				<ProgressBar percentage={marketplaceAppsPercentage || 0} variant={(marketplaceAppsPercentage || 0) >= 80 ? 'danger' : 'success'} />
			</Box>
			<Box fontScale='c1' mb={12}>
				<Box display='flex' flexGrow='1' justifyContent='space-between' mbe={4}>
					<div>{t('Private_apps')}</div>
					<Box color={(privateAppsPercentage || 0) >= 80 ? 'font-danger' : 'status-font-on-success'}>
						{privateAppsEnabled} / {privateAppsLimitCount}
					</Box>
				</Box>

				<ProgressBar percentage={privateAppsPercentage || 0} variant={(privateAppsPercentage || 0) >= 80 ? 'danger' : 'success'} />
			</Box>
		</FeatureUsageCard>
	);
};
export default AppsUsageCard;
