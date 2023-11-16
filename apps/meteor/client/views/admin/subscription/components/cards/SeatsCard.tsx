import { Palette } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import type { CardProps } from '../FeatureUsageCard';
import FeatureUsageCard from '../FeatureUsageCard';
import UsagePieGraph from '../UsagePieGraph';

type SeatsCardProps = {
	value: number;
	max: number;
};

const SeatsCard = ({ value, max }: SeatsCardProps): ReactElement => {
	const { t } = useTranslation();

	const pieGraph = {
		used: value,
		total: max,
	};

	const nearLimit = pieGraph && pieGraph.used / pieGraph.total >= 0.8;

	const card: CardProps = {
		title: t('Seats'),
		infoText: t('Seats_InfoText'),
		...(nearLimit && {
			upgradeButtonText: t('Buy_more'),
		}),
	};

	const seatsLeft = pieGraph.total - pieGraph.used;
	const color = pieGraph.used / pieGraph.total >= 0.8 ? Palette.statusColor['status-font-on-danger'].toString() : undefined;

	const message = seatsLeft > 0 ? t('Seats_Available', { seatsLeft }) : t('Seats_Required', { seatsRequired: -seatsLeft });
	return (
		<FeatureUsageCard card={card}>
			<UsagePieGraph label={message} used={pieGraph.used} total={pieGraph.total} color={color} />
		</FeatureUsageCard>
	);
};

export default SeatsCard;
