import { Box, Skeleton } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useActiveConnections } from '../../../../hooks/useActiveConnections';
import type { CardProps } from '../FeatureUsageCard';
import FeatureUsageCard from '../FeatureUsageCard';

const ActiveSessionsCard = (): ReactElement => {
	const { t } = useTranslation();
	const { data: activeConnections, isLoading } = useActiveConnections();

	const { max, current } = activeConnections || {};

	const total = max || 0;
	const used = current || 0;
	const available = total - used;

	const exceedLimit = used >= total;

	const card: CardProps = {
		title: t('ActiveSessions'),
		infoText: t('ActiveSessions_InfoText'),
		showUpgradeButton: exceedLimit,
	};

	return (
		<FeatureUsageCard card={card}>
			{!isLoading && activeConnections ? (
				<Box textAlign='center'>
					<Box fontScale='h1' color={exceedLimit ? 'font-danger' : 'font-default'}>
						{used} / {total}
					</Box>
					<Box fontScale='p2' color='font-secondary-info'>
						{available} {t('ActiveSessions_available')}
					</Box>
				</Box>
			) : (
				<Skeleton variant='rect' width='x112' height='x112' />
			)}
		</FeatureUsageCard>
	);
};
export default ActiveSessionsCard;
