import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { BarChart } from './components/BarChart';
import { ReportCard } from './components/ReportCard';
import { useDepartmentsSection } from './hooks/useDepartmentsSection';

export const DepartmentsSection = () => {
	const t = useTranslation();
	const { data, onFilter } = useDepartmentsSection();

	return (
		<ReportCard title={t('Departments')} onFilter={onFilter}>
			<BarChart data={data} direction='horizontal' height={200} />
		</ReportCard>
	);
};
