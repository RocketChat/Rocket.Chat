import { Skeleton } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import type { FeatureUsageCardProps } from './FeatureUsageCard';
import FeatureUsageCard from './FeatureUsageCard';
import type { UsagePieGraphProps } from './UsagePieGraph';
import UsagePieGraph from './UsagePieGraph';

type PieGraphCardProps = {
	pieGraph: UsagePieGraphProps | undefined;
	card: FeatureUsageCardProps;
	isLoading: boolean;
};

const PieGraphCard = ({ pieGraph, card, isLoading }: PieGraphCardProps): ReactElement => {
	const t = useTranslation();

	const quantityAvailable = pieGraph && Math.max(pieGraph.total - pieGraph.used, 0);
	const color = pieGraph && pieGraph.used / pieGraph.total >= 0.8 ? colors.d500 : undefined;

	return (
		<FeatureUsageCard
			title={card.title}
			infoText={card.infoText}
			showUpgradeButton={card.showUpgradeButton}
			upgradeButtonText={card.upgradeButtonText}
		>
			{!isLoading && pieGraph ? (
				<UsagePieGraph label={`${quantityAvailable} ${t('Available')}`} used={pieGraph.used} total={pieGraph.total} color={color} />
			) : (
				<Skeleton variant='rect' width='x112' height='x112' />
			)}
		</FeatureUsageCard>
	);
};

export default memo(PieGraphCard);
