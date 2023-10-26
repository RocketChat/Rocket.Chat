import type { ReactElement } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import type { CardProps } from '../FeatureUsageCard';
import PieGraphCard from '../PieGraphCard';

type MACCardProps = {
	macLimit?: { value?: number; max: number };
};

const MACCard = ({ macLimit }: MACCardProps): ReactElement => {
	const { t } = useTranslation();

	const pieGraph = macLimit && {
		used: macLimit?.value || 0,
		total: macLimit.max || 100,
	};

	const nearLimit = pieGraph && pieGraph.used / pieGraph.total >= 0.8;

	const card: CardProps = {
		title: t('Monthly_active_contacts'),
		infoText: t('MAC_InfoText'),
		showUpgradeButton: nearLimit,
		upgradeButtonText: 'Buy_more',
	};

	return <PieGraphCard pieGraph={pieGraph} card={card} isLoading={!macLimit} />;
};

export default MACCard;
