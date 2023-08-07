import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { PieChart } from './components/PieChart';
import { ReportCard } from './components/ReportCard';
import { useStatusSection } from './hooks/useStatusSection';

export const StatusSection = () => {
	const t = useTranslation();
	const { data, onFilter } = useStatusSection();

	return (
		<ReportCard title={t('Status')} onFilter={onFilter}>
			<PieChart data={data} width={200} height={200} />
		</ReportCard>
	);
};
