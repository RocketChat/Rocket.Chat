import { Skeleton, Text } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { useFormatDate } from '../../../../../hooks/useFormatDate';
import { useStatistics } from '../../../../hooks/useStatistics';
import FeatureUsageCardBody from '../../layout/FeatureUsageCardBody';
import UsageFigure from '../../layout/UsageFigure';
import type { CardProps } from '../FeatureUsageCard';
import FeatureUsageCard from '../FeatureUsageCard';
import UpgradeButton from '../UpgradeButton';

const ActiveSessionsPeakCard = () => {
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
				<UpgradeButton target='active-session-peak-card' action='upgrade' size='small'>
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
			<UsageFigure>
				<Text fontScale='h1' color={exceedLimit ? 'danger' : 'default'}>
					{used} / {total}
				</Text>
				<Text color='secondary-info'>{formatDate(new Date())}</Text>
			</UsageFigure>
		</FeatureUsageCard>
	);
};

export default ActiveSessionsPeakCard;
