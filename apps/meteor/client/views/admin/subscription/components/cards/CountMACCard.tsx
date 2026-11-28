import { Icon, Stack, Text } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import FeatureUsageCardBody from '../../layout/FeatureUsageCardBody';
import FeatureUsageCard from '../FeatureUsageCard';

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
				<Stack direction='row' align='center' justify='center' gap='x4'>
					<Icon color='hint' name='headset' size={40} />
					<Text fontScale='h1'>{macsCount}</Text>
				</Stack>
			</FeatureUsageCardBody>
		</FeatureUsageCard>
	);
};
export default CountMACCard;
