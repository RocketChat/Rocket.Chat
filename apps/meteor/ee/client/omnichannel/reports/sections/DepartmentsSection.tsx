import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { BarChart, ReportCard } from '../components';
import { useDepartmentsSection } from '../hooks';

export const DepartmentsSection = () => {
	const t = useTranslation();
	const { data, config } = useDepartmentsSection();

	return (
		<ReportCard title={t('Conversations_by_departments')} {...config}>
			<BarChart data={data} direction='horizontal' height={360} margins={{ top: 0, right: 0, bottom: 0, left: 90 }} />
		</ReportCard>
	);
};
