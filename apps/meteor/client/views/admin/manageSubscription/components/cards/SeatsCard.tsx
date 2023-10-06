import type { ReactElement } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useSeatsCap } from '../../../../../../ee/client/views/admin/users/useSeatsCap';
import { PlanName } from '../../../../../lib/utils/getPlanName';
import PieGraphCard from '../PieGraphCard';

type SeatsCardProps = {
	plan: PlanName;
};

const SeatsCard = ({ plan }: SeatsCardProps): ReactElement => {
	const { t } = useTranslation();
	const seatsCap = useSeatsCap();

	const pieGraph = seatsCap && {
		used: seatsCap.activeUsers,
		total: seatsCap.maxActiveUsers,
	};

	const nearLimit = pieGraph && pieGraph.used / pieGraph.total >= 0.8;

	const card = {
		title: t('Seats'),
		infoText: t('Seats_InfoText'),
		showUpgradeButton: nearLimit,
		upgradeButtonText: plan === PlanName.STARTER ? 'Upgrade' : 'Buy_more_seats',
	};

	return <PieGraphCard pieGraph={pieGraph} card={card} isLoading={Boolean(!seatsCap)} />;
};

export default SeatsCard;
