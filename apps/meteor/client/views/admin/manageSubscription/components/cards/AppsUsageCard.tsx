import { Box, ProgressBar, Skeleton } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useAppsCountQuery } from '../../../../marketplace/hooks/useAppsCountQuery';
import type { CardProps } from '../FeatureUsageCard';
import FeatureUsageCard from '../FeatureUsageCard';

type AppsUsageCardProps = {
	privateAppsLimit?: number;
	marketplaceAppsLimit?: number;
};

const AppsUsageCard = ({ privateAppsLimit, marketplaceAppsLimit }: AppsUsageCardProps): ReactElement => {
	const { t } = useTranslation();
	const { data: privateApps } = useAppsCountQuery('private');
	const { data: marketplaceApps } = useAppsCountQuery('installed');

	const { enabled: privateAppsEnabled, limit: privateAppsLimitQuery, percentage: privateAppsPercentage } = privateApps || {};
	const {
		enabled: marketplaceAppsEnabled,
		limit: marketplaceAppsLimitQuery,
		percentage: marketplaceAppsPercentage,
	} = marketplaceApps || {};

	const privateAppsLimitCount = privateAppsLimit || privateAppsLimitQuery;
	const marketplaceAppsLimitCount = marketplaceAppsLimit || marketplaceAppsLimitQuery;

	const card: CardProps = {
		title: t('Apps'),
		infoText: t('Apps_InfoText'),
		showUpgradeButton: (marketplaceAppsPercentage || 0) >= 80,
	};

	return (
		<FeatureUsageCard card={card}>
			{privateApps && marketplaceApps ? (
				<Box w='full' display='flex' flexDirection='column'>
					<Box mb={12}>
						<Box display='flex' flexGrow='1' justifyContent='space-between' mbe={4}>
							<Box fontScale='c1'>{t('Marketplace_apps')}</Box>
							<Box fontScale='c1' color={(marketplaceAppsPercentage || 0) >= 80 ? 'font-danger' : 'status-font-on-success'}>
								{marketplaceAppsEnabled} / {(marketplaceAppsLimitCount || 0) > 0 ? marketplaceAppsLimitCount : 5}
							</Box>
						</Box>

						<ProgressBar
							percentage={marketplaceAppsPercentage || 0}
							variant={(marketplaceAppsPercentage || 0) >= 80 ? 'danger' : 'success'}
						/>
					</Box>
					<Box mb={12}>
						<Box display='flex' flexGrow='1' justifyContent='space-between' mbe={4}>
							<Box fontScale='c1'>{t('Private_apps')}</Box>
							<Box fontScale='c1' color={(privateAppsPercentage || 0) >= 80 ? 'font-danger' : 'status-font-on-success'}>
								{privateAppsEnabled} / {(privateAppsLimitCount || 0) > 0 ? privateAppsLimitCount : 3}
							</Box>
						</Box>

						<ProgressBar percentage={privateAppsPercentage || 0} variant={(privateAppsPercentage || 0) >= 80 ? 'danger' : 'success'} />
					</Box>
				</Box>
			) : (
				<Skeleton variant='rect' width='x112' height='x112' />
			)}
		</FeatureUsageCard>
	);
};
export default AppsUsageCard;
