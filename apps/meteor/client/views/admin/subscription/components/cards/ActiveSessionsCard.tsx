import { Box, Skeleton } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useActiveConnections } from '../../../../hooks/useActiveConnections';
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

const ActiveSessionsCard = (): ReactElement => {
	const { t } = useTranslation();
	const result = useActiveConnections();

	const card: CardProps = {
		title: t('ActiveSessions'),
		infoText: t('ActiveSessions_InfoText'),
	};

	if (result.isLoading || result.isError) {
		return (
			<FeatureUsageCard card={card}>
				<Skeleton variant='rect' width='x112' height='x112' />
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
						<UpgradeButton target='active-session-card' action='upgrade' small>
							{t('Upgrade')}
						</UpgradeButton>
					),
				}),
			}}
		>
			<Box color='font-secondary-info'>
				<Box fontScale='h1' color={exceedLimit ? 'font-danger' : 'font-default'} mbe={12}>
					{used} / {total}
				</Box>
				{available} {t('ActiveSessions_available')}
			</Box>
		</FeatureUsageCard>
	);
};

export default ActiveSessionsCard;
