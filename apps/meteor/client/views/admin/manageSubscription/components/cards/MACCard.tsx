import type { ReactElement } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { PlanName } from '../../../../../lib/utils/getPlanName';
import { useStatistics } from '../../../../hooks/useStatistics';
import PieGraphCard from '../PieGraphCard';

type MACCardProps = {
	plan: PlanName;
	monthlyActiveContactsLimit?: number;
};

const MACCard = ({ plan, monthlyActiveContactsLimit }: MACCardProps): ReactElement => {
	const { t } = useTranslation();
	const { data, isLoading } = useStatistics({ refresh: 'true' });
	const { omnichannelContactsBySource } = data || {};

	const defaultMaxMAC = plan === PlanName.STARTER ? 100 : 15000;

	const pieGraph = omnichannelContactsBySource && {
		used: omnichannelContactsBySource?.contactsCount || 0,
		total: monthlyActiveContactsLimit || defaultMaxMAC,
	};

	const nearLimit = pieGraph && pieGraph.used / pieGraph.total >= 0.8;

	const card = {
		title: t('Monthly_active_contacts'),
		infoText: t('MAC_InfoText'),
		showUpgradeButton: nearLimit,
		upgradeButtonText: plan === PlanName.STARTER ? 'Upgrade' : 'Buy_MAC_packs',
	};

	return <PieGraphCard pieGraph={pieGraph} card={card} isLoading={isLoading} />;
};

export default MACCard;
