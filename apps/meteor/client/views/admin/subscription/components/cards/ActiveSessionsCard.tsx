import { Skeleton, Text } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { useActiveConnections } from '../../../../hooks/useActiveConnections';
import FeatureUsageCardBody from '../../layout/FeatureUsageCardBody';
import UsageFigure from '../../layout/UsageFigure';
import type { CardProps } from '../FeatureUsageCard';
import FeatureUsageCard from '../FeatureUsageCard';
import UpgradeButton from '../UpgradeButton';

const getLimits = ({ max, current }: { max: number; current: number }) => {
	const total = max || 0;
	const used = current || 0;
	const available = total - used;

	const exceedLimit = used >= total;

	return {
		total,
		used,
		available,
		exceedLimit,
	};
};

const ActiveSessionsCard = () => {
	const { t } = useTranslation();
	const result = useActiveConnections();

	const card: CardProps = {
		title: t('ActiveSessions'),
		infoText: t('ActiveSessions_InfoText'),
	};

	if (result.isPending || result.isError) {
		return (
			<FeatureUsageCard card={card}>
				<FeatureUsageCardBody justifyContent='flex-start'>
					<Skeleton variant='rect' width='x112' height='x224' />
				</FeatureUsageCardBody>
			</FeatureUsageCard>
		);
	}

	const { total, used, available, exceedLimit } = getLimits(result.data);

	return (
		<FeatureUsageCard
			card={{
				...card,
				...(exceedLimit && {
					upgradeButton: (
						<UpgradeButton target='active-session-card' action='upgrade' size='small'>
							{t('Upgrade')}
						</UpgradeButton>
					),
				}),
			}}
		>
			<FeatureUsageCardBody justifyContent='flex-start'>
				<UsageFigure>
					<Text fontScale='h1' color={exceedLimit ? 'danger' : 'default'}>
						{used} / {total}
					</Text>
					<Text color='secondary-info'>
						{available} {t('ActiveSessions_available')}
					</Text>
				</UsageFigure>
			</FeatureUsageCardBody>
		</FeatureUsageCard>
	);
};

export default ActiveSessionsCard;
