import { Box, Icon, Skeleton } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useStatistics } from '../../../../hooks/useStatistics';
import FeatureUsageCard from '../FeatureUsageCard';

const CountMACCard = (): ReactElement => {
	const { t } = useTranslation();
	const { data, isLoading } = useStatistics({ refresh: 'true' });
	const { omnichannelContactsBySource } = data || {};

	const card = {
		title: t('Monthly_active_contacts'),
		infoText: t('CountMAC_InfoText'),
	};

	const MACCount = omnichannelContactsBySource?.contactsCount;

	return (
		<FeatureUsageCard title={card.title} infoText={card.infoText}>
			{!isLoading && MACCount ? (
				<Box fontScale='h1'>
					<Icon color='font-annotation' name='headset' size={40} mie={4} />
					{MACCount}
				</Box>
			) : (
				<Skeleton variant='rect' width='x112' height='x112' />
			)}
		</FeatureUsageCard>
	);
};
export default CountMACCard;
