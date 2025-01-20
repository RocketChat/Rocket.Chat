import { Box, Icon } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import FeatureUsageCard from '../FeatureUsageCard';
import FeatureUsageCardBody from '../FeatureUsageCardBody';

const CountMACCard = ({ macsCount }: { macsCount: number }): ReactElement => {
	const { t } = useTranslation();

	return (
		<FeatureUsageCard
			card={{
				title: t('Monthly_active_contacts'),
				infoText: t('CountMAC_InfoText'),
			}}
		>
			<FeatureUsageCardBody>
				<Box fontScale='h1'>
					<Icon color='font-annotation' name='headset' size={40} mie={4} />
					{macsCount}
				</Box>
			</FeatureUsageCardBody>
		</FeatureUsageCard>
	);
};
export default CountMACCard;
