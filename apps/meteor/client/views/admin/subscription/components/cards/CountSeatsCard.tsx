import { Box, Icon } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import FeatureUsageCard from '../FeatureUsageCard';

const CountSeatsCard = ({ activeUsers }: { activeUsers: number }): ReactElement => {
	const { t } = useTranslation();

	return (
		<FeatureUsageCard
			card={{
				title: t('Seats'),
				infoText: t('CountSeats_InfoText'),
			}}
		>
			<Box fontScale='h1'>
				<Icon color='font-annotation' name='user' size={40} mie={4} />
				{activeUsers}
			</Box>
		</FeatureUsageCard>
	);
};
export default CountSeatsCard;
