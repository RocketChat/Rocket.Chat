import { useMemo } from 'react';

import { PieChart, ReportCard } from '../components';
import { COLORS } from '../components/constants';
import { useChannelsSection } from '../hooks';

export const ChannelsSection = () => {
	const { data, ...config } = useChannelsSection();
	const colors = useMemo(() => Object.values(COLORS), []);

	return (
		<ReportCard {...config}>
			<PieChart data={data} width={200} height={200} colors={colors} />
		</ReportCard>
	);
};
