import colors from '@rocket.chat/fuselage-tokens/colors';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import type { CardProps } from './FeatureUsageCard';
import FeatureUsageCard from './FeatureUsageCard';
import type { UsagePieGraphProps } from './UsagePieGraph';
import UsagePieGraph from './UsagePieGraph';

type PieGraphCardProps = {
	pieGraph: UsagePieGraphProps;
	card: CardProps;
};

const PieGraphCard = ({ pieGraph, card }: PieGraphCardProps): ReactElement => {
	const t = useTranslation();

	const quantityAvailable = pieGraph && Math.max(pieGraph.total - pieGraph.used, 0);
	const color = pieGraph && pieGraph.used / pieGraph.total >= 0.8 ? colors.d500 : undefined;

	return (
		<FeatureUsageCard card={card}>
			<UsagePieGraph label={`${quantityAvailable} ${t('Available')}`} used={pieGraph.used} total={pieGraph.total} color={color} />
		</FeatureUsageCard>
	);
};

export default memo(PieGraphCard);
