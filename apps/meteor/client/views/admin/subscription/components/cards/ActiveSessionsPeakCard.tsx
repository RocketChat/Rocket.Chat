import { Box, Skeleton } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useFormatDate } from '../../../../../hooks/useFormatDate';
import { useStatistics } from '../../../../hooks/useStatistics';
import type { CardProps } from '../FeatureUsageCard';
import FeatureUsageCard from '../FeatureUsageCard';
import FeatureUsageCardBody from '../FeatureUsageCardBody';
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

	if (isLoading || maxMonthlyPeakConnections === undefined) {
		return (
			<FeatureUsageCard card={card}>
				<FeatureUsageCardBody justifyContent='flex-start'>
					<Skeleton variant='rect' width='x112' height='x112' />
				</FeatureUsageCardBody>
			</FeatureUsageCard>
		);
	}

	return (
		<FeatureUsageCard card={card}>
			<Box color='font-secondary-info' textAlign='center'>
				<Box fontScale='h1' color={exceedLimit ? 'font-danger' : 'font-default'} mbe={12}>
					{used} / {total}
				</Box>
				{formatDate(new Date())}
			</Box>
		</FeatureUsageCard>
	);
};

export default ActiveSessionsPeakCard;
