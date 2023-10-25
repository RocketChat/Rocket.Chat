import type { ReactElement } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useSeatsCap } from '../../../../../../ee/client/views/admin/users/useSeatsCap';
import type { CardProps } from '../FeatureUsageCard';
import PieGraphCard from '../PieGraphCard';

const SeatsCard = (): ReactElement => {
	const { t } = useTranslation();
	const seatsCap = useSeatsCap();

	const pieGraph = seatsCap && {
		used: seatsCap.activeUsers,
		total: seatsCap.maxActiveUsers,
	};

	const nearLimit = pieGraph && pieGraph.used / pieGraph.total >= 0.8;

	const card: CardProps = {
		title: t('Seats'),
		infoText: t('Seats_InfoText'),
		showUpgradeButton: nearLimit,
		upgradeButtonText: 'Buy_more',
	};

	return <PieGraphCard pieGraph={pieGraph} card={card} isLoading={Boolean(!seatsCap)} />;
};

export default SeatsCard;
