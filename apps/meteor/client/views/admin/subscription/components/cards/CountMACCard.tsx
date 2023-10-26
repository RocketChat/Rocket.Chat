import { Box, Icon, Skeleton } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import type { CardProps } from '../FeatureUsageCard';
import FeatureUsageCard from '../FeatureUsageCard';

const CountMACCard = ({ MACsCount }: { MACsCount?: number }): ReactElement => {
	const { t } = useTranslation();

	const card: CardProps = {
		title: t('Monthly_active_contacts'),
		infoText: t('CountMAC_InfoText'),
	};

	const qtyMACs = MACsCount || 0;

	return (
		<FeatureUsageCard card={card}>
			{MACsCount !== undefined ? (
				<Box fontScale='h1'>
					<Icon color='font-annotation' name='headset' size={40} mie={4} />
					{qtyMACs}
				</Box>
			) : (
				<Skeleton variant='rect' width='x112' height='x112' />
			)}
		</FeatureUsageCard>
	);
};
export default CountMACCard;
