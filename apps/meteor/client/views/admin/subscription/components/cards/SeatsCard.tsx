import type { ReactElement } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import type { CardProps } from '../FeatureUsageCard';
import PieGraphCard from '../PieGraphCard';

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
		showUpgradeButton: nearLimit,
		upgradeButtonText: 'Buy_more',
	};

	return <PieGraphCard pieGraph={pieGraph} card={card} />;
};

export default SeatsCard;
