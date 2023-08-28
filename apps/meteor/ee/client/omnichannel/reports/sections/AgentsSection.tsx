/* eslint-disable react/no-multi-comp */
import { Box, Flex, Skeleton } from '@rocket.chat/fuselage';
import { useBreakpoints } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { AgentsTable, BarChart, ReportCard } from '../components';
import { useAgentsSection } from '../hooks';
import { ellipsis } from '../utils/ellipsis';

const LoadingSkeleton = () => (
	<Box display='flex' height='100%' width='100%'>
		<Box flexGrow={1}>
			<Skeleton style={{ transform: 'none' }} height='100%' mb={8} mie={16} />
		</Box>
		<Box flexGrow={1}>
			<Skeleton height={28} />
			<Skeleton height={28} />
			<Skeleton height={28} />
			<Skeleton height={28} />
			<Skeleton height={28} />
		</Box>
	</Box>
);

export const AgentsSection = () => {
	const { data, sortBy, sortDirection, setSort, ...config } = useAgentsSection();
	const t = useTranslation();
	const breakpoints = useBreakpoints();
	const isSmallScreen = !breakpoints.includes('lg');

	return (
		<ReportCard {...config} full minHeight={360} loadingSkeleton={<LoadingSkeleton />}>
			<Box display='flex' style={{ gap: '1rem' }} flexWrap='wrap' flexDirection={isSmallScreen ? 'column' : 'row'}>
				<Flex.Item grow={1} shrink={0} basis='auto'>
					<Box>
						<Box is='p' fontScale='p2' mbe={8}>
							{t('Top_5_agents_with_the_most_conversations')}
						</Box>
						<BarChart
							data={data.slice(0, 5)}
							height={360}
							indexBy='label'
							keys={['value']}
							margins={{ top: 45, right: 0, bottom: 50, left: 50 }}
							axis={{
								axisBottom: {
									tickSize: 0,
									tickRotation: 0,
									format: (v) => ellipsis(v, 10),
								},
								axisLeft: {
									tickSize: 0,
									tickRotation: 0,
									tickValues: 4,
								},
							}}
						/>
					</Box>
				</Flex.Item>
				<Flex.Item grow={1} shrink={0} basis='auto'>
					<Box display='flex' minWidth='50%' height={390}>
						<AgentsTable data={data} sortBy={sortBy} sortDirection={sortDirection} setSort={setSort} />
					</Box>
				</Flex.Item>
			</Box>
		</ReportCard>
	);
};
