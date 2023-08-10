import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { PieChart, ReportCard } from '../components';
import { useStatusSection } from '../hooks';

export const StatusSection = () => {
	const t = useTranslation();
	const { data, ...config } = useStatusSection();

	return (
		<ReportCard title={t('Conversations_by_status')} height={200} {...config}>
			<PieChart data={data} width={300} height={200} />
		</ReportCard>
	);
};
