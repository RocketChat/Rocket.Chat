import { Box, Icon, Skeleton } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useSeatsCap } from '../../../../../../ee/client/views/admin/users/useSeatsCap';
import FeatureUsageCard from '../FeatureUsageCard';

const CountSeatsCard = (): ReactElement => {
	const { t } = useTranslation();
	const seatsCap = useSeatsCap();

	const card = {
		title: t('Seats'),
		infoText: t('CountSeats_InfoText'),
	};

	const maxSeats = seatsCap?.maxActiveUsers;

	return (
		<FeatureUsageCard title={card.title} infoText={card.infoText}>
			{seatsCap ? (
				<Box fontScale='h1'>
					<Icon color='font-annotation' name='user' size={40} mie={4} />
					{maxSeats}
				</Box>
			) : (
				<Skeleton variant='rect' width='x112' height='x112' />
			)}
		</FeatureUsageCard>
	);
};
export default CountSeatsCard;
