import { Box, Skeleton } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useSeatsCap } from '../../../../../../ee/client/views/admin/users/useSeatsCap';
import FeatureUsageCard from '../FeatureUsageCard';

const ConcurrentUsersCard = (): ReactElement => {
	const { t } = useTranslation();
	const seatsCap = useSeatsCap();

	const card = {
		title: t('Concurrent_users'),
		infoText: 'teste',
	};

	const total = seatsCap?.maxActiveUsers || 0;
	const used = seatsCap?.activeUsers || 0;
	const available = total - used;

	const exceedLimit = used >= total;

	return (
		<FeatureUsageCard title={card.title} infoText={card.infoText} showUpgradeButton={exceedLimit}>
			{seatsCap ? (
				<Box textAlign='center'>
					<Box fontScale='h1' color={exceedLimit ? 'font-danger' : 'font-default'}>
						{used} / {total}
					</Box>
					<Box fontScale='p2' color='font-secondary-info'>
						{available} {t('Concurrent_users_available')}
					</Box>
				</Box>
			) : (
				<Skeleton variant='rect' width='x112' height='x112' />
			)}
		</FeatureUsageCard>
	);
};
export default ConcurrentUsersCard;
