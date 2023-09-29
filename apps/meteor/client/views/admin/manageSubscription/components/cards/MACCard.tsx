import type { ReactElement } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useSeatsCap } from '../../../../../../ee/client/views/admin/users/useSeatsCap';
import PieGraphCard from '../PieGraphCard';

const MACCard = (): ReactElement => {
	const { t } = useTranslation();
	const seatsCap = useSeatsCap();

	const pieGraph = seatsCap && {
		used: seatsCap.activeUsers,
		total: seatsCap.maxActiveUsers,
	};

	const card = {
		title: t('Monthly_active_contacts'),
		infoText: 'teste',
		showUpgradeButton: pieGraph && pieGraph.used / pieGraph.total >= 0.8,
	};

	return <PieGraphCard pieGraph={pieGraph} card={card} />;
};
export default MACCard;
