import { Icon, Stack, Text } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import FeatureUsageCardBody from '../../layout/FeatureUsageCardBody';
import FeatureUsageCard from '../FeatureUsageCard';

export type CountSeatsCardProps = { activeUsers: number };

const CountSeatsCard = ({ activeUsers }: CountSeatsCardProps) => {
	const { t } = useTranslation();

	return (
		<FeatureUsageCard
			card={{
				title: t('Seats'),
				infoText: t('CountSeats_InfoText'),
			}}
		>
			<FeatureUsageCardBody>
				<Stack direction='row' align='center' justify='center' gap='x4'>
					<Icon color='hint' name='user' size={40} />
					<Text fontScale='h1'>{activeUsers}</Text>
				</Stack>
			</FeatureUsageCardBody>
		</FeatureUsageCard>
	);
};
export default CountSeatsCard;
