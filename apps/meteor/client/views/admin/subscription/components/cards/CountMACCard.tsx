import { Box, Icon } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import FeatureUsageCard from '../FeatureUsageCard';
import FeatureUsageCardBody from '../FeatureUsageCardBody';

export type CountMACCardProps = { macsCount: number };

const CountMACCard = ({ macsCount }: CountMACCardProps) => {
	const { t } = useTranslation();

	return (
		<FeatureUsageCard
			card={{
				title: t('Monthly_active_contacts'),
				infoText: t('CountMAC_InfoText'),
			}}
		>
			<FeatureUsageCardBody>
				<Box fontScale='h1' display='flex' alignItems='center' justifyContent='center' gap={4}>
					<Icon color='hint' name='headset' size={40} />
					{macsCount}
				</Box>
			</FeatureUsageCardBody>
		</FeatureUsageCard>
	);
};
export default CountMACCard;
