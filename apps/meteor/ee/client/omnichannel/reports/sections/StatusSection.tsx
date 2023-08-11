import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { PieChart, ReportCard } from '../components';
import { useStatusSection } from '../hooks';

export const StatusSection = () => {
	const t = useTranslation();
	const { data, ...config } = useStatusSection();

	const subTitle = t('__count__conversations__period__', {
		count: total,
		period: config.period,
	});

	return (
		<ReportCard title={t('Conversations_by_status')} height={200} subTitle={subTitle} {...config}>
			<PieChart data={data} width={300} height={200} />
		</ReportCard>
	);
};
