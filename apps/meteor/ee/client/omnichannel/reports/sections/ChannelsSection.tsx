import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { PieChart, ReportCard } from '../components';
import { useChannelsSection } from '../hooks';

export const ChannelsSection = () => {
	const t = useTranslation();
	const { data, onFilter } = useChannelsSection();

	return (
		<ReportCard title={t('Conversations_by_channel')} onFilter={onFilter}>
			<PieChart data={data} width={300} height={200} />
		</ReportCard>
	);
};
