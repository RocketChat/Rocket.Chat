import React from 'react';

import { PieChart, ReportCard } from '../components';
import { useStatusSection } from '../hooks';

export const StatusSection = () => {
	const { data, ...config } = useStatusSection();

	return (
		<ReportCard {...config} height={200}>
			<PieChart data={data} width={350} height={200} />
		</ReportCard>
	);
};
