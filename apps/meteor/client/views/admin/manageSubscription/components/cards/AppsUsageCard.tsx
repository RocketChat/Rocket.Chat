import { Box, ProgressBar, Skeleton } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useSeatsCap } from '../../../../../../ee/client/views/admin/users/useSeatsCap';
import FeatureUsageCard from '../FeatureUsageCard';

const AppsUsageCard = (): ReactElement => {
	const { t } = useTranslation();
	const seatsCap = useSeatsCap();

	const card = {
		title: t('Apps'),
		infoText: 'teste',
	};

	// const total = seatsCap?.maxActiveUsers || 0;
	// const used = seatsCap?.activeUsers || 0;
	const total = 5;
	const used = 4;
	const percentage = (used / total) * 100;
	const closeToLimit = percentage >= 80;

	return (
		<FeatureUsageCard title={card.title} infoText={card.infoText} showUpgradeButton={closeToLimit}>
			{seatsCap ? (
				<Box w='full' display='flex' flexDirection='column'>
					<Box mb={12}>
						<Box display='flex' flexGrow='1' justifyContent='space-between' mbe={4}>
							<Box fontScale='c1'>{t('Marketplace_apps')}</Box>
							<Box fontScale='c1' color={closeToLimit ? 'font-danger' : 'status-font-on-success'}>
								{used} / {total}
							</Box>
						</Box>

						<ProgressBar percentage={percentage} variant={closeToLimit ? 'danger' : 'success'} />
					</Box>
					<Box mb={12}>
						<Box display='flex' flexGrow='1' justifyContent='space-between' mbe={4}>
							<Box fontScale='c1'>{t('Private_apps')}</Box>
							<Box fontScale='c1' color={closeToLimit ? 'font-danger' : 'status-font-on-success'}>
								{used} / {total}
							</Box>
						</Box>

						<ProgressBar percentage={percentage} variant={closeToLimit ? 'danger' : 'success'} />
					</Box>
				</Box>
			) : (
				<Skeleton variant='rect' width='x112' height='x112' />
			)}
		</FeatureUsageCard>
	);
};
export default AppsUsageCard;
