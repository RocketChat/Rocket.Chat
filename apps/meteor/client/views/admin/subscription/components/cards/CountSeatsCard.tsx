import { Box, Icon } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import FeatureUsageCard from '../FeatureUsageCard';
import FeatureUsageCardBody from '../FeatureUsageCardBody';

const CountSeatsCard = ({ activeUsers }: { activeUsers: number }): ReactElement => {
	const { t } = useTranslation();

	return (
		<FeatureUsageCard
			card={{
				title: t('Seats'),
				infoText: t('CountSeats_InfoText'),
			}}
		>
			<FeatureUsageCardBody>
				<Box fontScale='h1' display='flex' alignItems='center' justifyContent='center'>
					<Icon color='font-annotation' name='user' size={40} mie={4} />
					{activeUsers}
				</Box>
			</FeatureUsageCardBody>
		</FeatureUsageCard>
	);
};
export default CountSeatsCard;
