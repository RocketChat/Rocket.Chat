import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { BarChart } from './components/BarChart';
import { ReportCard } from './components/ReportCard';
import { useDepartmentsSection } from './hooks/useDepartmentsSection';

export const DepartmentsSection = () => {
	const t = useTranslation();
	const { data, periodSelectorProps } = useDepartmentsSection();

	return (
		<ReportCard title={t('Departments')} periodSelectorProps={periodSelectorProps} data={data}>
			<BarChart data={data} direction='horizontal' height={360} />
		</ReportCard>
	);
};
