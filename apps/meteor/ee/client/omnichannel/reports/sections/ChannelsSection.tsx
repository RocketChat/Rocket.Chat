import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { PieChart, ReportCard } from '../components';
import { useChannelsSection } from '../hooks';

export const ChannelsSection = () => {
	const t = useTranslation();
	const { data, total, period, ...config } = useChannelsSection();

	const subtitle = t('__count__conversations__period__', {
		count: total ?? 0,
		period,
	});

	return (
		<ReportCard title={t('Conversations_by_channel')} height={200} subtitle={subtitle} {...config}>
			<PieChart data={data} width={300} height={200} />
		</ReportCard>
	);
};
