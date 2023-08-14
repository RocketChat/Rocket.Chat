import React from 'react';

import { PieChart, ReportCard } from '../components';
import { useChannelsSection } from '../hooks';

export const ChannelsSection = () => {
	const { data, ...config } = useChannelsSection();

	return (
		<ReportCard {...config} height={200}>
			<PieChart data={data} width={350} height={200} />
		</ReportCard>
	);
};
