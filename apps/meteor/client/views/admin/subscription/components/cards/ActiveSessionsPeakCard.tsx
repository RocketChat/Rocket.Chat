import { Box, Skeleton } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useFormatDate } from '../../../../../hooks/useFormatDate';
import { useStatistics } from '../../../../hooks/useStatistics';
import type { CardProps } from '../FeatureUsageCard';
import FeatureUsageCard from '../FeatureUsageCard';
import UpgradeButton from '../UpgradeButton';

const ActiveSessionsPeakCard = (): ReactElement => {
	const { t } = useTranslation();
	const { data, isLoading } = useStatistics();
	const formatDate = useFormatDate();

	const { maxMonthlyPeakConnections } = data || {};

	const total = 200;
	const used = maxMonthlyPeakConnections || 0;

	const exceedLimit = used >= total;

	const card: CardProps = {
		title: t('ActiveSessionsPeak'),
		infoText: t('ActiveSessionsPeak_InfoText'),
		...(exceedLimit && {
			upgradeButton: (
				<UpgradeButton target='active-session-peak-card' action='upgrade' small>
					{t('Upgrade')}
				</UpgradeButton>
			),
		}),
	};

	return (
		<FeatureUsageCard card={card}>
			{!isLoading && maxMonthlyPeakConnections !== undefined ? (
				<Box textAlign='center'>
					<Box fontScale='h1' color={exceedLimit ? 'font-danger' : 'font-default'}>
						{used} / {total}
					</Box>
					<Box fontScale='p2' color='font-secondary-info' mbs={12}>
						{formatDate(new Date())}
					</Box>
				</Box>
			) : (
				<Skeleton variant='rect' width='x112' height='x112' />
			)}
		</FeatureUsageCard>
	);
};

export default ActiveSessionsPeakCard;
