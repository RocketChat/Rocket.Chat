import type { ReactElement } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useSeatsCap } from '../../../../../../ee/client/views/admin/users/useSeatsCap';
import { PlanName } from '../../../../../lib/utils/getPlanName';
import PieGraphCard from '../PieGraphCard';

type MACCardProps = {
	plan: PlanName;
};

// TODO: waiting this implementation: https://github.com/RocketChat/Rocket.Chat/pull/30439/
const MACCard = ({ plan }: MACCardProps): ReactElement => {
	const { t } = useTranslation();
	const seatsCap = useSeatsCap();

	const pieGraph = seatsCap && {
		used: seatsCap.activeUsers,
		total: seatsCap.maxActiveUsers,
	};

	const nearLimit = pieGraph && pieGraph.used / pieGraph.total >= 0.8;

	const card = {
		title: t('Monthly_active_contacts'),
		infoText: t('MAC_InfoText'),
		showUpgradeButton: nearLimit,
		upgradeButtonText: plan === PlanName.STARTER ? 'Upgrade' : 'Buy_MAC_packs',
	};

	return <PieGraphCard pieGraph={pieGraph} card={card} />;
};

export default MACCard;
