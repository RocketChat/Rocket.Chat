import { Box, ProgressBar, Skeleton } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useAppsCountQuery } from '../../../../marketplace/hooks/useAppsCountQuery';
import FeatureUsageCard from '../FeatureUsageCard';

const AppsUsageCard = (): ReactElement => {
	const { t } = useTranslation();
	const { data: privateApps } = useAppsCountQuery('private');
	const { data: marketplaceApps } = useAppsCountQuery('installed');

	const { enabled: privateAppsEnabled, limit: privateAppsLimit, percentage: privateAppsPercentage } = privateApps || {};
	const { enabled: marketplaceAppsEnabled, limit: marketplaceAppsLimit, percentage: marketplaceAppsPercentage } = privateApps || {};

	const card = {
		title: t('Apps'),
		infoText: t('Apps_InfoText'),
	};

	return (
		<FeatureUsageCard title={card.title} infoText={card.infoText} showUpgradeButton={(marketplaceAppsPercentage || 0) >= 80}>
			{privateApps && marketplaceApps ? (
				<Box w='full' display='flex' flexDirection='column'>
					<Box mb={12}>
						<Box display='flex' flexGrow='1' justifyContent='space-between' mbe={4}>
							<Box fontScale='c1'>{t('Marketplace_apps')}</Box>
							<Box fontScale='c1' color={(marketplaceAppsPercentage || 0) >= 80 ? 'font-danger' : 'status-font-on-success'}>
								{marketplaceAppsEnabled} / {(marketplaceAppsLimit || 0) > 0 ? marketplaceAppsLimit : 5}
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
								{privateAppsEnabled} / {(privateAppsLimit || 0) > 0 ? privateAppsLimit : 3}
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
