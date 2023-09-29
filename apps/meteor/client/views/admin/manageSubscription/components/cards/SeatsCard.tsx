import type { ReactElement } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useSeatsCap } from '../../../../../../ee/client/views/admin/users/useSeatsCap';
import PieGraphCard from '../PieGraphCard';

const SeatsCard = (): ReactElement => {
	const { t } = useTranslation();
	const seatsCap = useSeatsCap();

	const pieGraph = seatsCap && {
		used: seatsCap.activeUsers,
		total: seatsCap.maxActiveUsers,
	};

	const card = {
		title: t('Seats'),
		infoText:
			'Monthly Active Contacts (MAC) are contacts that have sent or received a message over the billing month. We count a single contact, regardless of how many messages or channels that single contact uses within the billing month.',
		showUpgradeButton: pieGraph && pieGraph.used / pieGraph.total >= 0.8,
	};

	return <PieGraphCard pieGraph={pieGraph} card={card} />;
};
export default SeatsCard;
