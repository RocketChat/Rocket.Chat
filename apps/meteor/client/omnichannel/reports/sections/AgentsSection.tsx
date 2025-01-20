import { Box } from '@rocket.chat/fuselage';
import { useResizeObserver } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from 'react-i18next';

import { AgentsTable, BarChart, ReportCard } from '../components';
import { useAgentsSection } from '../hooks';
import { ellipsis } from '../utils/ellipsis';

const BREAKPOINT = 768;

export const AgentsSection = () => {
	const { data, sortBy, sortDirection, setSort, ...config } = useAgentsSection();
	const { t } = useTranslation();

	const { ref, contentBoxSize: { inlineSize: cardWidth = 200 } = {} } = useResizeObserver<HTMLElement>();
	const width = cardWidth * 0.9;
	const wrapped = cardWidth ? cardWidth < BREAKPOINT : false;

	return (
		<ReportCard ref={ref} {...config}>
			<Box display='flex' flexDirection={wrapped ? 'column' : 'row'}>
				<Box flexGrow={1}>
					<Box is='p' fontScale='p2' mbe={8}>
						{t('Top_5_agents_with_the_most_conversations')}
					</Box>
					<BarChart
						data={data.slice(0, 5)}
						maxWidth={wrapped ? width : width / 2}
						height={360}
						indexBy='label'
						keys={['value']}
						margins={{ top: 40, right: 20, bottom: 48, left: 20 }}
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

				<Box display='flex' h='x360' minWidth='50%' flexGrow={1}>
					<AgentsTable data={data} sortBy={sortBy} sortDirection={sortDirection} setSort={setSort} />
				</Box>
			</Box>
		</ReportCard>
	);
};
