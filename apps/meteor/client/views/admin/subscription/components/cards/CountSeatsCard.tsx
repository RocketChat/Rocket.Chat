import { Box, Icon, Skeleton } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import type { CardProps } from '../FeatureUsageCard';
import FeatureUsageCard from '../FeatureUsageCard';

const CountSeatsCard = ({ activeUsers }: { activeUsers?: number }): ReactElement => {
	const { t } = useTranslation();

	const card: CardProps = {
		title: t('Seats'),
		infoText: t('CountSeats_InfoText'),
	};

	const maxSeats = activeUsers || 0;

	return (
		<FeatureUsageCard card={card}>
			{maxSeats ? (
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
